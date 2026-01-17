"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import styles from "../../login/login.module.css";
import { authenticate } from "@/lib/auth-actions";

export default function AdminLoginPage() {
    const [errorMessage, dispatch] = useFormState(authenticate, undefined);

    return (
        <div className="container flex-center" style={{ minHeight: '80vh' }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%', borderColor: 'var(--primary)' }}>
                <h2 style={{ textAlign: 'center' }}>Admin Login</h2>
                <p style={{ textAlign: 'center', marginBottom: '1rem', color: '#666' }}>Sensitive Area - Authorized Access Only</p>

                <form action={dispatch} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label>Admin Username</label>
                        <input type="email" name="email" placeholder="admin@rosi.com" required />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Secret Password</label>
                        <input type="password" name="password" placeholder="••••••••" required />
                    </div>

                    <LoginButton />

                    {errorMessage && (
                        <div style={{ color: 'red', marginTop: '1rem', textAlign: 'center', fontWeight: 'bold' }}>
                            {errorMessage}
                        </div>
                    )}
                </form>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <Link href="/" style={{ color: '#666', fontSize: '0.9rem' }}>← Cancel</Link>
                </div>
            </div>
        </div>
    );
}

function LoginButton() {
    const { pending } = useFormStatus();

    return (
        <button className="btn btn-primary" aria-disabled={pending} disabled={pending} style={{ width: '100%', marginTop: '1rem' }}>
            {pending ? 'Verifying...' : 'Access Dashboard'}
        </button>
    );
}
