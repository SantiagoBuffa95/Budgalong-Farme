'use server';

import { getSessionFarmIdOrThrow, ensureAdmin, logAudit } from '@/lib/auth-helpers';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const INVITE_TOKEN_EXPIRY_HOURS = 72; // 3 days

/**
 * Generate a secure invite token for an employee
 * Admin-only action
 */
export async function generateInviteToken(employeeId: string) {
    await ensureAdmin();
    const { farmId, userId } = await getSessionFarmIdOrThrow();

    // Verify employee belongs to admin's farm
    const employee = await prisma.employee.findFirst({
        where: {
            id: employeeId,
            farmId,
        },
        include: {
            user: true,
        },
    });

    if (!employee) {
        return { error: 'Employee not found or access denied.' };
    }

    if (employee.user && employee.user.password) {
        return { error: 'Employee already has an account. Use password reset instead.' };
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + INVITE_TOKEN_EXPIRY_HOURS);

    // Create or update user with invite token
    let user;
    if (employee.userId) {
        user = await prisma.user.update({
            where: { id: employee.userId },
            data: {
                inviteToken: token,
                inviteTokenExpires: expiresAt,
                inviteCreatedAt: new Date(),
            },
        });
    } else {
        // Create user if doesn't exist
        const tempEmailSuffix = crypto.randomBytes(4).toString('hex');
        user = await prisma.user.create({
            data: {
                email: `${employee.legalName.toLowerCase().replace(/\s+/g, '.')}.${tempEmailSuffix}@temp.budgalong.local`,
                name: employee.legalName,
                role: 'employee',
                farmId,
                isActive: false, // Will be activated on invite acceptance
                inviteToken: token,
                inviteTokenExpires: expiresAt,
                inviteCreatedAt: new Date(),
            },
        });

        // Link employee to user
        await prisma.employee.update({
            where: { id: employeeId },
            data: { userId: user.id },
        });
    }

    await logAudit('INVITE_GENERATED', userId, farmId, {
        employeeId,
        employeeName: employee.legalName,
        expiresAt,
    });

    const inviteLink = `${process.env.NEXTAUTH_URL}/invite/${token}`;

    return {
        success: true,
        token,
        inviteLink,
        expiresAt: expiresAt.toISOString(),
    };
}

/**
 * Validate an invite token
 */
export async function validateInviteToken(token: string) {
    const user = await prisma.user.findUnique({
        where: { inviteToken: token },
        include: {
            employeeProfile: true,
        },
    });

    if (!user || !user.inviteToken || !user.inviteTokenExpires) {
        return { valid: false, error: 'Invalid invite link.' };
    }

    if (new Date() > user.inviteTokenExpires) {
        return { valid: false, error: 'Invite link has expired. Please contact your administrator.' };
    }

    if (user.password) {
        return { valid: false, error: 'Account already activated. Please use the login page.' };
    }

    return {
        valid: true,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            employeeName: user.employeeProfile?.legalName,
        },
    };
}

/**
 * Accept invite and set password
 */
export async function acceptInvite(
    token: string,
    email: string,
    password: string
) {
    const validation = await validateInviteToken(token);

    if (!validation.valid) {
        return { error: validation.error };
    }

    const user = await prisma.user.findUnique({
        where: { inviteToken: token },
    });

    if (!user) {
        return { error: 'Invalid invite token.' };
    }

    // Validate password strength
    if (password.length < 8) {
        return { error: 'Password must be at least 8 characters long.' };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user
    try {
        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                email,
                password: hashedPassword,
                isActive: true,
                emailVerified: new Date(),
                inviteToken: null,
                inviteTokenExpires: null,
            },
        });

        // Helper: Ensure audit log captures the event
        await logAudit('INVITE_ACCEPTED', user.id, user.farmId || 'system', {
            email,
        });

        return { success: true };
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { error: 'This email is already in use by another account.' };
        }
        console.error('Invite acceptance error:', error);
        return { error: 'Failed to activate account. Please try again.' };
    }
}

/**
 * Get all employees for admin's farm
 */
export async function getEmployees() {
    await ensureAdmin();
    const { farmId } = await getSessionFarmIdOrThrow();

    const employees = await prisma.employee.findMany({
        where: {
            farmId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    isActive: true,
                    inviteToken: true,
                    inviteTokenExpires: true,
                    role: true
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return employees.map((emp) => ({
        id: emp.id,
        legalName: emp.legalName,
        preferredName: emp.preferredName,
        phone: emp.phone,
        employmentStatus: emp.employmentStatus,
        startDate: emp.startDate.toISOString(),
        hasAccount: !!emp.user?.isActive,
        hasPendingInvite: !!emp.user?.inviteToken && new Date() < (emp.user?.inviteTokenExpires || new Date()),
        email: emp.user?.email,
        role: emp.user?.role
    }));
}

/**
 * Get users that can be linked to a new employee (no employee profile yet)
 */
export async function getAvailableUsers() {
    await ensureAdmin();
    const { farmId } = await getSessionFarmIdOrThrow();

    const users = await prisma.user.findMany({
        where: {
            farmId,
            isActive: true,
            employeeProfile: null // No employee linked yet
        },
        select: {
            id: true,
            name: true,
            email: true
        },
        orderBy: { name: 'asc' }
    });

    return users;
}

/**
 * Create a new employee (admin only)
 */
/**
 * Create a new employee (admin only)
 */
import { encrypt } from '@/lib/encryption';

export async function createEmployee(formData: {
    // Personal
    legalName: string;
    preferredName?: string;
    phone?: string;
    email?: string; // Optional invite email
    address?: string;
    suburb?: string;
    state?: string;
    postcode?: string;
    dateOfBirth?: string;
    tfn?: string;

    // Employment
    startDate: string;
    contractType: string; // full_time, part_time, casual, salary
    classification: string;

    // Pay & Rates
    ordinaryHoursPerWeek: number;
    hourlyRate?: number;
    salaryAnnual?: number;
    overtimeMode?: string;
    casualLoading?: boolean;
    allowancesConfig?: any;

    // Superannuation
    superFundName?: string;
    superMemberNumber?: string;
    superUSI?: string;
    superABN?: string;

    // Link to existing user
    linkUserId?: string;
}) {
    await ensureAdmin();
    const { farmId, userId } = await getSessionFarmIdOrThrow();

    // Clean up optional fields
    const tfnEncrypted = formData.tfn ? encrypt(formData.tfn) : null;
    const dob = formData.dateOfBirth ? new Date(formData.dateOfBirth) : null;

    // Prepare Contract Data
    const contractData: any = {
        farmId,
        type: formData.contractType || 'casual',
        classification: formData.classification || 'Level 1',
        ordinaryHoursPerWeek: formData.ordinaryHoursPerWeek,
        allowancesConfig: formData.allowancesConfig || {},
        status: 'active',
        awardPackVersion: 'v2026.1'
    };

    // Handle Pay Mode Specifics
    if (formData.contractType === 'salary') {
        contractData.salaryAnnual = formData.salaryAnnual;
        contractData.overtimeMode = formData.overtimeMode || 'included';
        if (formData.salaryAnnual && formData.ordinaryHoursPerWeek > 0) {
            contractData.baseRateHourly = formData.salaryAnnual / 52 / formData.ordinaryHoursPerWeek;
        }
    } else {
        contractData.baseRateHourly = formData.hourlyRate;
        contractData.overtimeMode = 'award_default';
    }

    const employee = await prisma.employee.create({
        data: {
            farmId,
            userId: formData.linkUserId || null, // Link to existing user if provided
            legalName: formData.legalName,
            preferredName: formData.preferredName,
            phone: formData.phone,
            address: formData.address,
            suburb: formData.suburb,
            state: formData.state,
            postcode: formData.postcode,
            dateOfBirth: dob,
            tfn: tfnEncrypted,
            employmentStatus: 'active',
            startDate: new Date(formData.startDate),
            ordinaryHoursPerWeek: formData.ordinaryHoursPerWeek,
            contracts: {
                create: contractData
            },
            // Create Super Fund if details provided
            ...(formData.superFundName ? {
                superFund: {
                    create: {
                        fundName: formData.superFundName,
                        memberNumber: formData.superMemberNumber,
                        usi: formData.superUSI,
                        abn: formData.superABN
                    }
                }
            } : {})
        },
    });

    // If email provided, verify it's not taken by another user before creating invite logic
    // (Optional: auto-invite logic can be triggered here if desired)

    await logAudit('EMPLOYEE_CREATED', userId, farmId, {
        employeeId: employee.id,
        employeeName: employee.legalName,
        contractType: formData.contractType
    });

    return { success: true, employeeId: employee.id, error: undefined };
}

export async function toggleEmployeeStatus(employeeId: string, isActive: boolean) {
    await ensureAdmin();
    const { farmId, userId } = await getSessionFarmIdOrThrow();

    const emp = await prisma.employee.findUnique({ where: { id: employeeId, farmId }, include: { user: true } });
    if (!emp) return { success: false, message: "Employee not found" };

    // Update Employee status
    await prisma.employee.update({
        where: { id: employeeId },
        data: { employmentStatus: isActive ? 'active' : 'terminated' }
    });

    // If they have a user account, update that too
    if (emp.userId) {
        await prisma.user.update({
            where: { id: emp.userId },
            data: { isActive: isActive }
        });
    }

    await logAudit('EMPLOYEE_STATUS_CHANGE', userId, farmId, { employeeId, newStatus: isActive ? 'active' : 'inactive' });

    return { success: true };
}

export async function toggleAdminRole(employeeId: string, isAdmin: boolean) {
    await ensureAdmin();
    const { farmId, userId: currentAdminId } = await getSessionFarmIdOrThrow();

    const emp = await prisma.employee.findUnique({ where: { id: employeeId, farmId }, include: { user: true } });
    if (!emp) return { success: false, message: "Employee not found" };
    if (!emp.userId) return { success: false, message: "Employee has no user account yet" };
    if (emp.userId === currentAdminId) return { success: false, message: "Cannot change your own role" };

    await prisma.user.update({
        where: { id: emp.userId },
        data: { role: isAdmin ? 'admin' : 'employee' }
    });

    await logAudit('ROLE_CHANGE', currentAdminId, farmId, { targetUserId: emp.userId, newRole: isAdmin ? 'admin' : 'employee' });

    return { success: true };
}
