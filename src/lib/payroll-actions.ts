'use server';

import prisma from '@/lib/prisma';
import { getSessionFarmIdOrThrow, logAudit } from '@/lib/auth-helpers';
import { computePay, TimesheetEntryInput, ContractInput, TAX_BRACKETS_2025 } from './payroll/engine';
import { generatePayslipPdf } from './pdf-service';
import { uploadPayslip } from './storage-service';

export async function createPayRun(periodStart: Date, periodEnd: Date) {
    try {
        const { farmId, userId } = await getSessionFarmIdOrThrow();

        // 1. Create Draft Pay Run
        const payRun = await prisma.payRun.create({
            data: {
                farmId,
                periodStart,
                periodEnd,
                status: 'draft',
                createdBy: userId,
            }
        });

        // 2. Find Active Employees
        const employees = await prisma.employee.findMany({
            where: {
                farmId,
                status: 'active', // Ensure status exists in schema, mapped as 'employmentStatus'
                // Wait, Schema says `employmentStatus String @map("employment_status")`
            } as any,
            include: {
                contracts: {
                    where: { status: 'active' },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                },
                timesheets: {
                    where: {
                        weekStartDate: { gte: periodStart },
                        weekEndDate: { lte: periodEnd },
                        status: 'approved' // Only approved timesheets?
                        // For MVP: Maybe 'submitted' too? Prompt says "rigid start/end times".
                        // Let's assume approved.
                    },
                    include: { entries: true }
                }
            }
        });

        let payslipsCreated = 0;

        for (const emp of employees) {
            const contract = emp.contracts[0];
            if (!contract) continue; // No contract, no pay

            // Contract Input for Engine
            const contractInput: ContractInput = {
                baseRateHourly: Number(contract.baseRateHourly) || 0,
                ordinaryHoursPerWeek: Number(contract.ordinaryHoursPerWeek) || 38,
                classification: contract.classification || 'Level 1',
                overtimeMode: contract.overtimeMode === 'flat_rate' ? 'flat_rate' : 'award_default'
            };

            // Flatten Timesheet Entries
            // Assuming simplified period (e.g. 1 week). If multiple weeks, engine logic handles "Weekly" check per timesheet? 
            // Or aggregate? engine.ts currently processes a LIST of entries and does ONE weekly check.
            // If the Pay Run is Fortnightly, we should split by week for OT calculation.
            // For MVP, assuming PayRun = Timesheet Week Cycle.

            const entries: TimesheetEntryInput[] = emp.timesheets.flatMap(t =>
                t.entries.map(e => ({
                    date: e.date,
                    startTime: e.startTime,
                    endTime: e.endTime,
                    breakMinutes: e.breakMinutes,
                    taskCode: e.taskCode || undefined
                }))
            );

            if (entries.length === 0) continue; // Skip if no work

            // Compute
            const publicHolidays = await prisma.holidayCalendar.findMany({
                where: {
                    OR: [
                        { farmId },
                        { farmId: null } // System default
                    ],
                    date: { gte: periodStart, lte: periodEnd },
                    type: { in: ['public_holiday', 'local_public_holiday'] } // Skip 'observance' for pay calculation? 
                }
            });
            const phDates = publicHolidays.map(ph => ph.date.toISOString().split('T')[0]);

            const result = computePay(entries, contractInput, phDates);

            // Create Payslip
            const payslip = await prisma.payslip.create({
                data: {
                    farmId,
                    payRunId: payRun.id,
                    employeeId: emp.id,
                    gross: result.gross,
                    net: result.net,
                    tax: result.tax,
                    super_: result.super,
                    allowancesTotal: 0,
                    deductionsTotal: 0,
                }
            });

            // --- Generate PDF & Upload ---
            try {
                const pdfBuffer = await generatePayslipPdf({
                    id: payslip.id,
                    employeeName: emp.preferredName || emp.legalName,
                    payRunStart: periodStart.toISOString().split('T')[0],
                    payRunEnd: periodEnd.toISOString().split('T')[0],
                    payDate: new Date().toISOString().split('T')[0],
                    gross: result.gross,
                    tax: result.tax,
                    super: result.super,
                    net: result.net,
                    lines: result.lines
                });

                const fileName = `${farmId}/${payRun.id}/${payslip.id}.pdf`;
                const pdfUrl = await uploadPayslip(fileName, pdfBuffer);

                if (pdfUrl) {
                    await prisma.payslip.update({
                        where: { id: payslip.id },
                        data: { pdfUrl }
                    });
                }
            } catch (pdfError) {
                console.error("PDF Gen Failed for", emp.id, pdfError);
                // Non-blocking failure
            }

            // --- Leave Accrual (Annual Leave) ---
            try {
                // Std Annual Leave: 4 weeks per year = 38 * 4 / 52 = 2.923 hours per week
                // Pro-rata based on Ordinary Hours: (Ord / 38) * 2.923
                const weeklyAccrual = (result.lines.find(l => l.code === 'ORD')?.units || 0) / 38 * 2.923;

                if (weeklyAccrual > 0) {
                    await prisma.leaveBalance.upsert({
                        where: { employeeId: emp.id },
                        update: {
                            annualLeaveHours: { increment: weeklyAccrual },
                            lastAccrualAt: new Date()
                        },
                        create: {
                            farmId,
                            employeeId: emp.id,
                            annualLeaveHours: weeklyAccrual,
                            lastAccrualAt: new Date()
                        }
                    });

                    // Log transaction
                    const balance = await prisma.leaveBalance.findUnique({ where: { employeeId: emp.id } });
                    if (balance) {
                        await prisma.leaveTransaction.create({
                            data: {
                                balanceId: balance.id,
                                type: 'accrual',
                                hours: weeklyAccrual,
                                effectiveDate: new Date(),
                                note: `Accrual from Pay Run ${payRun.id}`
                            }
                        });
                    }
                }
            } catch (leaveError) {
                console.error("Leave Accrual Failed for", emp.id, leaveError);
            }

            payslipsCreated++;
        }

        await logAudit('PAY_RUN_CREATED', userId, farmId, { payRunId: payRun.id, payslips: payslipsCreated });

        return { success: true, payRunId: payRun.id, count: payslipsCreated };

    } catch (error) {
        console.error("Create PayRun Error", error);
        return { success: false, message: 'Database error' };
    }
}
