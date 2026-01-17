'use server';

import { signIn, signOut, auth } from '@/auth';
import { AuthError } from 'next-auth';
import { logAudit } from '@/lib/auth-helpers';

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}

export async function logout() {
    try {
        const session = await auth();
        if (session?.user) {
            const { id, farmId, email } = session.user;
            await logAudit('LOGOUT', id, farmId || 'system', { email });
        }
    } catch (e) {
        console.error("Logout log error", e);
    }
    await signOut({ redirectTo: "/" });
}
