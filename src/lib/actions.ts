'use server';

import { NewContractData, Contract as ContractType, WeeklyTimesheet } from './types';
import prisma from '@/lib/prisma';
import { getSessionFarmIdOrThrow, ensureAdmin, logAudit } from '@/lib/auth-helpers';
import bcrypt from 'bcryptjs';
import { computePay } from './payroll/engine';

// --- CONTRACTS ---

export async function saveContract(data: NewContractData): Promise<{ success: boolean; message?: string }> {
    try {
        await ensureAdmin();
        const { farmId, userId: adminId } = await getSessionFarmIdOrThrow();

        const { firstName, lastName, email, type, classification, baseRate, salaryAnnual, allowances, deductions } = data;

        // 1. Find or Create User
        let user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            const hashedPassword = await bcrypt.hash("welcome123", 10);
            user = await prisma.user.create({
                data: {
                    email,
                    name: `${firstName} ${lastName}`,
                    password: hashedPassword,
                    role: 'employee',
                    farmId,
                }
            });
        }

        // 2. Find or Create Employee Profile
        let employee = await prisma.employee.findUnique({
            where: { userId: user.id },
        });

        if (!employee) {
            employee = await prisma.employee.create({
                data: {
                    farmId,
                    userId: user.id,
                    legalName: `${firstName} ${lastName}`,
                    preferredName: firstName,
                    employmentStatus: 'active',
                    startDate: new Date(),
                    ordinaryHoursPerWeek: 38, // Default
                }
            });
        }

        // 3. Create Contract
        await prisma.contract.create({
            data: {
                farmId,
                employeeId: employee.id,
                type: type, // Matches schema now
                classification,
                baseRateHourly: baseRate,
                salaryAnnual: salaryAnnual,
                ordinaryHoursPerWeek: 38,
                overtimeMode: 'award_default', // Default
                allowancesConfig: allowances as any,
                deductionsConfig: deductions as any,
                awardPackVersion: 'v2020.1',
                status: 'active',
            }
        });

        await logAudit('CONTRACT_CREATED', adminId, farmId, { employeeId: employee.id });

        return { success: true };
    } catch (error) {
        console.error('Failed to save contract:', error);
        return { success: false, message: 'Database error' };
    }
}

export async function getContracts(): Promise<ContractType[]> {
    try {
        const { farmId } = await getSessionFarmIdOrThrow();

        const employees = await prisma.employee.findMany({
            where: { farmId },
            include: {
                contracts: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                },
                user: true
            }
        });

        // Map to UI Type
        return employees.map(emp => {
            const contract = emp.contracts[0];
            const user = emp.user;

            return {
                id: contract?.id || '',
                employeeId: emp.id,
                firstName: emp.preferredName || emp.legalName.split(' ')[0],
                lastName: emp.legalName.split(' ').slice(1).join(' ') || '',
                email: user?.email || '',
                type: (contract?.type as any) || 'employee',
                classification: contract?.classification || 'N/A',
                baseRate: Number(contract?.baseRateHourly) || 0,
                superannuation: true,
                allowances: (contract?.allowancesConfig as any) || { dog: false, horse: false, firstAid: false, meal: false },
                deductions: (contract?.deductionsConfig as any) || { accommodation: 0, meat: 0 },
                status: (contract?.status as any) || 'Draft',
                startDate: emp.startDate.toISOString().split('T')[0],
            };
        });

    } catch (error) {
        console.error("Error fetching contracts:", error);
        return [];
    }
}

// Returns the contract of the CURRENT logged-in user only
export async function getMyContract(): Promise<ContractType | null> {
    try {
        const { farmId, userId } = await getSessionFarmIdOrThrow();

        // Find the employee linked to the current user
        const employee = await prisma.employee.findUnique({
            where: { userId },
            include: {
                contracts: {
                    where: { status: 'active' },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                },
                user: true
            }
        });

        if (!employee || employee.contracts.length === 0) {
            return null;
        }

        const contract = employee.contracts[0];
        const user = employee.user;

        return {
            id: contract.id,
            employeeId: employee.id,
            firstName: employee.preferredName || employee.legalName.split(' ')[0],
            lastName: employee.legalName.split(' ').slice(1).join(' ') || '',
            email: user?.email || '',
            type: (contract.type as any) || 'employee',
            classification: contract.classification || 'N/A',
            baseRate: Number(contract.baseRateHourly) || 0,
            superannuation: true,
            allowances: (contract.allowancesConfig as any) || { dog: false, horse: false, firstAid: false, meal: false },
            deductions: (contract.deductionsConfig as any) || { accommodation: 0, meat: 0 },
            status: (contract.status as any) || 'Draft',
            startDate: employee.startDate.toISOString().split('T')[0],
        };

    } catch (error) {
        console.error("Error fetching my contract:", error);
        return null;
    }
}

// --- TIMESHEETS ---

export async function saveTimesheet(data: any): Promise<{ success: boolean; message?: string }> {
    try {
        const { farmId, userId } = await getSessionFarmIdOrThrow();

        // 1. Get Employee for User
        const employee = await prisma.employee.findUnique({
            where: { userId },
        });

        if (!employee) {
            return { success: false, message: "Employee profile not found" };
        }

        const { weekEnding, entries } = data; // Assuming data shape from UI

        // Parse Week End Date
        const weekEnd = new Date(weekEnding);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekEnd.getDate() - 6);

        // 2. Fetch Active Contract for Pay Calculation
        const contract = await prisma.contract.findFirst({
            where: { employeeId: employee.id, status: { equals: 'active', mode: 'insensitive' } },
            orderBy: { createdAt: 'desc' }
        });

        // 3. Prepare Pay Data
        let financialSnapshot = {};

        if (contract) {
            try {


                // Helper to get PH dates - simplified for speed, ideally should fetch real calendar
                // For MVP, we pass empty PH on submission or fetch quickly.
                // Let's fetch strict range.
                const weekStartDate = weekStart;
                const weekEndDate = weekEnd;

                const phs = await prisma.holidayCalendar.findMany({
                    where: {
                        OR: [{ farmId }, { farmId: null }],
                        date: { gte: weekStartDate, lte: weekEndDate },
                        type: { in: ['public_holiday', 'local_public_holiday'] }
                    }
                });
                const phDates = phs.map((ph: any) => ph.date.toISOString().split('T')[0]);

                const contractInput = {
                    baseRateHourly: Number(contract.baseRateHourly) || 0,
                    ordinaryHoursPerWeek: Number(contract.ordinaryHoursPerWeek) || 38,
                    classification: contract.classification || 'Level 1',
                    overtimeMode: (contract.overtimeMode === 'flat_rate' ? 'flat_rate' : 'award_default') as 'flat_rate' | 'award_default',
                    type: contract.type,
                    salaryAnnual: Number(contract.salaryAnnual) || 0
                };

                const entryInputs = entries.map((e: any) => ({
                    date: new Date(e.date),
                    startTime: new Date(`${e.date}T${e.startTime}:00`),
                    endTime: new Date(`${e.date}T${e.endTime}:00`), // Note: handle overnight if needed logic exists in engine
                    breakMinutes: Number(e.breakMinutes) || 0,
                    taskCode: e.activity
                }));

                // Fix Overnight dates for engine input if basic date parsing failed logic
                // The engine expects Date objects. We reconstructed them above.
                // Re-verify end time logic:
                entryInputs.forEach((e: any) => {
                    if (e.endTime < e.startTime) {
                        e.endTime.setDate(e.endTime.getDate() + 1);
                    }
                });

                const payResult = computePay(entryInputs, contractInput, phDates);

                financialSnapshot = {
                    grossPay: payResult.gross,
                    tax: payResult.tax,
                    super: payResult.super,
                    netPay: payResult.net
                };

            } catch (calcError) {
                console.error("Pay Calculation on Submit Failed", calcError);
                // We allow submission even if calc fails, but log it.
            }
        }

        // 4. Create Timesheet Header
        const timesheet = await prisma.timesheet.create({
            data: {
                farmId,
                employeeId: employee.id,
                weekStartDate: weekStart,
                weekEndDate: weekEnd,
                status: 'submitted',
                submittedAt: new Date(),
                ...financialSnapshot // Save the calculated money
            }
        });

        // 5. Create Entries
        for (const entry of entries) {
            if (!entry.startTime || !entry.endTime) continue;
            // ... (Entry creation logic same as before)
            const entryDate = new Date(entry.date);
            // Construct full Date objects for start/end
            const [startHour, startMin] = entry.startTime.split(':').map(Number);
            const [endHour, endMin] = entry.endTime.split(':').map(Number);

            const startDateTime = new Date(entryDate);
            startDateTime.setHours(startHour, startMin, 0);

            const endDateTime = new Date(entryDate);
            endDateTime.setHours(endHour, endMin, 0);

            // Handle overnight shift? If end < start, assume next day.
            if (endDateTime < startDateTime) {
                endDateTime.setDate(endDateTime.getDate() + 1);
            }

            await prisma.timesheetEntry.create({
                data: {
                    timesheetId: timesheet.id,
                    date: entryDate,
                    startTime: startDateTime,
                    endTime: endDateTime,
                    breakMinutes: Number(entry.breakMinutes) || 0,
                    taskCode: entry.activity || 'general',
                    notes: '',
                }
            });
        }

        await logAudit('TIMESHEET_SUBMITTED', userId, farmId, { timesheetId: timesheet.id });

        return { success: true };

    } catch (error) {
        console.error("Failed to save timesheet:", error);
        return { success: false, message: "Database error" };
    }
}

export async function getTimesheets(employeeId?: string): Promise<any[]> {
    try {
        const { farmId, role, userId } = await getSessionFarmIdOrThrow();

        // Security Check: If employee, strict match only
        if (role !== 'admin') {
            // Must find their own employee ID
            const emp = await prisma.employee.findUnique({ where: { userId } });
            if (!emp) return [];
            // Force filter by their ID
            employeeId = emp.id;
        }

        const where: any = { farmId };
        if (employeeId) {
            where.employeeId = employeeId;
        }

        const timesheets = await prisma.timesheet.findMany({
            where,
            include: {
                employee: true,
                entries: true
            },
            orderBy: { weekStartDate: 'desc' }
        });

        return timesheets.map((ts: any) => ({
            id: ts.id,
            employeeId: ts.employeeId,
            employeeName: ts.employee?.preferredName || "Unknown",
            weekEnding: ts.weekEndDate.toISOString().split('T')[0],
            status: ts.status === 'submitted' ? 'Pending' :
                (ts.status === 'approved' ? 'Approved' :
                    (ts.status === 'paid' ? 'Paid' :
                        (ts.status === 'rejected' ? 'Rejected' : 'Draft'))),
            submittedAt: ts.submittedAt?.toISOString(),
            financials: {
                gross: Number(ts.grossPay) || 0,
                tax: Number(ts.tax) || 0,
                super: Number(ts.super) || 0,
                net: Number(ts.netPay) || 0,
            },
            entries: ts.entries.map((e: any) => ({
                date: e.date.toISOString().split('T')[0],
                startTime: e.startTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false }),
                endTime: e.endTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false }),
                breakMinutes: e.breakMinutes,
                activity: e.taskCode
            }))
        }));

    } catch (error) {
        console.error("Error getTimesheets:", error);
        return [];
    }
}

export async function approveTimesheet(id: string): Promise<{ success: boolean }> {
    try {
        await ensureAdmin();
        const { farmId, userId } = await getSessionFarmIdOrThrow();

        await prisma.timesheet.update({
            where: { id, farmId }, // Ensure accessible in farm
            data: {
                status: 'approved',
                approvedAt: new Date(),
            }
        });

        await logAudit('TIMESHEET_APPROVED', userId, farmId, { timesheetId: id });

        return { success: true };
    } catch (error) {
        return { success: false };
    }
}
