'use server';

import prisma from '@/lib/prisma';
import { getSessionFarmIdOrThrow, ensureEmployeeAccess } from './auth-helpers';

export interface EmployeeDashboardData {
    legalName: string;
    preferredName: string | null;
    annualLeaveHours: number;
    recentPayslips: {
        id: string;
        payRunEnd: string;
        net: number;
        pdfUrl: string | null;
        timesheetId: string;
    }[];
}

export async function getEmployeeDashboardData(): Promise<EmployeeDashboardData | null> {
    try {
        const { farmId, userId } = await getSessionFarmIdOrThrow();

        const employee = await prisma.employee.findUnique({
            where: { userId },
            include: {
                leaveBalance: true,
                payslips: {
                    orderBy: { issuedAt: 'desc' },
                    take: 5,
                    include: { payRun: true }
                }
            }
        });

        if (!employee) return null;

        // We need timesheet IDs to allow PDF generation.
        const dashboardData: EmployeeDashboardData = {
            legalName: employee.legalName,
            preferredName: employee.preferredName,
            annualLeaveHours: Number(employee.leaveBalance?.annualLeaveHours) || 0,
            recentPayslips: []
        };

        for (const ps of employee.payslips) {
            // Find the timesheet for this PayRun period
            const ts = await prisma.timesheet.findFirst({
                where: {
                    employeeId: employee.id,
                    weekStartDate: ps.payRun.periodStart,
                    weekEndDate: ps.payRun.periodEnd
                },
                select: { id: true }
            });

            dashboardData.recentPayslips.push({
                id: ps.id,
                payRunEnd: ps.payRun.periodEnd.toISOString().split('T')[0],
                net: Number(ps.net),
                pdfUrl: null, // Force use of regenerate button
                timesheetId: ts?.id || ''
            });
        }

        return dashboardData;
    } catch (error) {
        console.error("Failed to get employee dashboard data", error);
        return null;
    }
}
