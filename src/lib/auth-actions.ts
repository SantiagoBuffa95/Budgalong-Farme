'use server';

import { signIn, signOut, auth } from '@/auth';
import { AuthError as NextAuthError } from 'next-auth';
import { logAudit, checkRateLimit } from '@/lib/auth-helpers';
import { sendEmail } from '@/lib/email';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export async function authenticate(
  prevState: { error?: string; email?: string } | undefined,
  formData: FormData,
) {
  const email = String(formData.get('email') || '').toLowerCase();
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

/**
 * Initiates the password reset process.
 * Generates a token, saves a HASH of it to the user, and logs the link (simulating email).
 */
export async function requestPasswordReset(email: string) {
  try {
    // Rate Limiting (Basic IP based)
    // Note: For valid email check, we might want stricter limits per email, but let's stick to IP for now or add specific email rate limit later.
    // checkRateLimit() is async and throws if limited.
    await checkRateLimit(); // Re-enable if you want stricter limits, but might block testing.

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Security: Don't reveal if user exists.
      // Fake delay to prevent timing attacks?
      await new Promise(resolve => setTimeout(resolve, 200));
      return { success: true, message: "If an account exists, a reset link has been sent." };
    }

    // Generate Secure Token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 Hour expiry

    // Update User with HASH
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash: tokenHash,
        resetTokenExpires: expires
      }
    });



    // Audit Log
    await logAudit('PASSWORD_RESET_REQUESTED', user.id, user.farmId || 'system', { email });

    // Send Email via Abstraction
    const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    await sendEmail({
      to: email,
      subject: "Reset your Budgalong Password",
      text: `Someone requested a password reset for your account. If this was you, click the link below to set a new password:\n\n${resetLink}\n\nThis link will expire in 1 hour.\nIf you didn't ask for this, you can ignore this email.`,
    });

    return { success: true, message: "If an account exists, a reset link has been sent." }; // Generic message

  } catch (error: any) {
    console.error("Request Password Reset Error:", error);
    if (error.message.includes("Too many requests")) {
      return { success: false, message: "Too many requests. Please try again later." };
    }
    return { success: false, message: "Something went wrong." };
  }
}

/**
 * Resets the password using a valid token.
 */
export async function resetPassword(token: string, newPassword: string) {
  try {
    // Rate Limiting for resets too (prevent brute force on tokens)
    await checkRateLimit();

    // Hash the incoming token to look it up
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetTokenHash: tokenHash,
        resetTokenExpires: { gt: new Date() }
      }
    });

    if (!user) {
      // Generic error or specific? For token mismatch, "Invalid or expired" is okay.
      return { success: false, message: "Invalid or expired reset token." };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetTokenHash: null,     // Consume token
        resetTokenExpires: null
      }
    });

    // Audit Log
    await logAudit('PASSWORD_RESET_COMPLETED', user.id, user.farmId || 'system', { email: user.email });

    return { success: true, message: "Password reset successfully. You can now login." };

  } catch (error: any) {
    console.error("Reset Password Error:", error);
    if (error.message.includes("Too many requests")) {
      return { success: false, message: "Too many requests. Please try again later." };
    }
    return { success: false, message: "Failed to reset password." };
  }
}
