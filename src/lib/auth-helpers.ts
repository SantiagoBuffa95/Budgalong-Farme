import { auth } from "@/auth";
import { LRUCache } from "lru-cache";
import { headers } from "next/headers";

// --- Rate Limiting ---
const rateLimitCache = new LRUCache<string, number>({
    max: 500, // Max 500 simultaneous keys
    ttl: 60 * 1000, // 1 minute window
});

const MAX_REQUESTS_PER_MINUTE = 10;

/**
 * Checks if the current request IP has exceeded the rate limit.
 * Throws an error if limited.
 */
export async function checkRateLimit() {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "127.0.0.1";

    const currentCount = rateLimitCache.get(ip) || 0;

    if (currentCount >= MAX_REQUESTS_PER_MINUTE) {
        throw new Error("Too many requests. Please try again later.");
    }

    rateLimitCache.set(ip, currentCount + 1);
}

// --- Audit Logging ---

import prisma from '@/lib/prisma';

export async function logAudit(action: string, userId: string, farmId: string, details?: any) {
    try {
        const headersList = await headers();
        const ip = headersList.get("x-forwarded-for") || "unknown";

        await prisma.auditLog.create({
            data: {
                action,
                userId,
                farmId,
                details,
                ipAddress: ip,
            }
        });
    } catch (error) {
        console.error("Audit Log Failed:", error);
        // Don't fail the main request just because log failed? Or SHOULD we?
        // For compliance, critical failures should maybe block.
        // But for robustness, maybe just log to console.
    }
}

// --- Strict Multi-tenancy & RBAC ---

export class AuthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AuthError";
    }
}

/**
 * Retrieves the current session and enforces that the user is authenticated
 * and belongs to a specific Farm.
 * @returns { session, farmId, userId, role }
 */
export async function getSessionFarmIdOrThrow() {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        throw new AuthError("Unauthorized: No active session.");
    }

    if (!session.user.farmId) {
        throw new AuthError("Unauthorized: User does not belong to a farm.");
    }

    return {
        session,
        farmId: session.user.farmId,
        userId: session.user.id,
        role: session.user.role,
    };
}

/**
 * Ensures that the current user is either an Admin or the specific Employee being accessed.
 * @param targetEmployeeUserId The user_id (not employee_id) of the resource owner
 */
export async function ensureEmployeeAccess(targetEmployeeUserId: string) {
    const { userId, role } = await getSessionFarmIdOrThrow();

    if (role === "admin") return; // Admins can access anyone in their farm

    if (userId !== targetEmployeeUserId) {
        throw new AuthError("Forbidden: You can only access your own records.");
    }
}

/**
 * Ensures the user has the 'admin' role.
 */
export async function ensureAdmin() {
    const { role } = await getSessionFarmIdOrThrow();
    if (role !== "admin") {
        throw new AuthError("Forbidden: Admin access required.");
    }
}
