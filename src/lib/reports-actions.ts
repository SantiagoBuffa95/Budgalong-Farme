'use server';

import prisma from '@/lib/prisma';
import { getSessionFarmIdOrThrow } from './auth-helpers';

export interface AdminStats {
    activeEmployees: number;
    pendingTimesheets: number;
    contractsDraft: number;
    lastPayRunDate: string | null;
}

export async function getAdminStats(): Promise<AdminStats> {
    try {
        const { farmId } = await getSessionFarmIdOrThrow();

        const [activeEmployees, pendingTimesheets, contractsDraft, lastPayRun] = await Promise.all([
            prisma.employee.count({
                where: { farmId, employmentStatus: 'active' } // Make sure 'employmentStatus' matches schema map
            }),
            prisma.timesheet.count({
                where: { farmId, status: 'submitted' }
            }),
            prisma.contract.count({
                where: { farmId, status: 'draft' }
            }),
            prisma.payRun.findFirst({
                where: { farmId },
                orderBy: { periodEnd: 'desc' },
                select: { periodEnd: true }
            })
        ]);

        return {
            activeEmployees,
            pendingTimesheets,
            contractsDraft,
            lastPayRunDate: lastPayRun?.periodEnd.toISOString().split('T')[0] || null
        };
    } catch (error) {
        console.error("Failed to get admin stats", error);
        return {
            activeEmployees: 0,
            pendingTimesheets: 0,
            contractsDraft: 0,
            lastPayRunDate: null
        };
    }
}
