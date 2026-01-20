'use server';

import { signIn, signOut, auth } from '@/auth';
import { AuthError as NextAuthError } from 'next-auth';
import { logAudit } from '@/lib/auth-helpers';

export async function authenticate(
  prevState: { error?: string; email?: string } | undefined,
  formData: FormData,
) {
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');

  // Input validation
  if (!email || !password) {
    return { error: 'Email and password are required.', email };
  }

  try {
    // Auth.js v5: Use redirectTo to let the framework handle the redirect
    // The authorized callback in auth.config.ts will validate role and route appropriately
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/', // Initial redirect target; auth.config will handle role-based routing
    });

    // This line won't execute on success because signIn redirects
    // It only runs if signIn fails without throwing
    return { error: 'Login failed. Please try again.', email };

  } catch (error: any) {
    // Auth.js throws specific errors that we need to handle

    // Check for credential errors (wrong password/email)
    if (error?.type === 'CredentialsSignin') {
      return {
        error: 'Invalid credentials. Please check your email and password.',
        email
      };
    }

    // IMPORTANT: Auth.js throws a NEXT_REDIRECT error on successful login to trigger the redirect
    // We must re-throw it to allow the redirect to happen
    if (error?.message?.includes('NEXT_REDIRECT')) {
      throw error;
    }

    // Log unexpected errors for debugging
    console.error('Login error:', error);
    return { error: 'Something went wrong. Please try again.', email };
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
    console.error('Logout log error:', e);
  }
  await signOut({ redirectTo: '/' });
}
