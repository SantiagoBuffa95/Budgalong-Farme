'use client';

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import styles from "./login.module.css";
import { authenticate } from "@/lib/auth-actions";
import Image from "next/image";

export default function LoginPage() {
    const [state, dispatch] = useActionState(authenticate, undefined);

    return (
        <div className="container flex-center" style={{ minHeight: '80vh' }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%', borderColor: 'var(--primary)' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <Image src="/brand/logo.png" alt="Budgalong" width={100} height={100} />
                    <h2 style={{ marginTop: '0.5rem' }}>Welcome Back</h2>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>Sign in to Budgalong</p>
                </div>

                <form action={dispatch} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="you@budgalong.com"
                            defaultValue={state?.email}
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Password</label>
                        <input type="password" name="password" placeholder="••••••••" required />
                    </div>

                    <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
                        <Link href="/forgot-password" style={{ fontSize: '0.8rem', color: '#666' }}>Forgot Password?</Link>
                    </div>

                    <LoginButton />

                    {state?.error && (
                        <div style={{ color: 'var(--accent)', marginTop: '1rem', textAlign: 'center', fontWeight: 'bold' }}>
                            {state.error}
                        </div>
                    )}
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                    <p style={{ fontSize: '0.8rem', color: '#999' }}>
                        Need help? Contact your System Administrator.
                    </p>
                    <Link href="/" className="btn btn-secondary" style={{ marginTop: '1rem', fontSize: '0.9rem' }}>← Back to Home</Link>
                </div>
            </div>
        </div>
    );
}

function LoginButton() {
    const { pending } = useFormStatus();

    return (
        <button className="btn btn-primary" aria-disabled={pending} disabled={pending} style={{ width: '100%', marginTop: '1rem' }}>
            {pending ? 'Signing in...' : 'Sign In'}
        </button>
    );
}
