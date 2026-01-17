"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import styles from "./login.module.css";
import { authenticate } from "@/lib/auth-actions";

export default function LoginPage() {
    const [errorMessage, dispatch] = useFormState(authenticate, undefined);

    return (
        <div className="container flex-center" style={{ minHeight: '80vh' }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
                <h2 style={{ textAlign: 'center' }}>Employee Login</h2>
                <p style={{ textAlign: 'center', marginBottom: '1rem', color: '#666' }}>Please access with your contract email</p>

                <form action={dispatch} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label>Email</label>
                        <input type="email" name="email" placeholder="john@budgalon.com" required />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Password</label>
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
                    <Link href="/" style={{ color: '#666', fontSize: '0.9rem' }}>← Home</Link>
                </div>
            </div>
        </div>
    );
}

function LoginButton() {
    const { pending } = useFormStatus();

    return (
        <button className="btn btn-primary" aria-disabled={pending} disabled={pending} style={{ width: '100%', marginTop: '1rem' }}>
            {pending ? 'Logging in...' : 'Login'}
        </button>
    );
}
