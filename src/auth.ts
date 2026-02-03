import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { checkRateLimit, logAudit } from '@/lib/auth-helpers';

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma) as any,
    session: { strategy: "jwt" }, // Required for Credentials provider with Adapter
    secret: process.env.AUTH_SECRET,
    trustHost: true,
    providers: [
        Credentials({
            credentials: {
                email: {},
                password: {},
            },


            async authorize(credentials) {
                try {
                    await checkRateLimit();
                } catch (error) {
                    // Return null to indicate failure (NextAuth will say "CredentialsSignin" by default or we can throw)
                    // Custom error handling in NextAuth is tricky, usually returns generic error.
                    // For MVP, just failing is enough security.
                    console.error("Rate limit exceeded or error:", error);
                    return null;
                }

                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(4) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;

                    const user = await prisma.user.findFirst({
                        where: {
                            email: { equals: email, mode: 'insensitive' }
                        },
                    });

                    if (!user || !user.password) return null;

                    const passwordsMatch = await bcrypt.compare(password, user.password);

                    if (passwordsMatch) {
                        try {
                            await logAudit('LOGIN_SUCCESS', user.id, user.farmId || 'system', { email });
                        } catch (e) {
                            console.error("Audit log error", e);
                        }

                        const userData = {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            farmId: user.farmId
                        };

                        // Dev-only logging for debugging (no secrets)
                        if (process.env.NODE_ENV === 'development') {
                            console.log('✓ Auth success:', { email: user.email, role: user.role });
                        }

                        return userData;
                    }
                }

                // Dev-only logging for debugging
                if (process.env.NODE_ENV === 'development') {
                    console.log('✗ Auth failed: Invalid credentials');
                }

                console.log("Invalid credentials");
                return null;
            },
        }),
    ],
});
