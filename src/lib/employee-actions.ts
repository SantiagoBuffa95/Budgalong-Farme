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

        return {
            legalName: employee.legalName,
            preferredName: employee.preferredName,
            annualLeaveHours: Number(employee.leaveBalance?.annualLeaveHours) || 0,
            recentPayslips: employee.payslips.map(ps => ({
                id: ps.id,
                payRunEnd: ps.payRun.periodEnd.toISOString().split('T')[0],
                net: Number(ps.net),
                pdfUrl: ps.pdfUrl
            }))
        };
    } catch (error) {
        console.error("Failed to get employee dashboard data", error);
        return null;
    }
}
