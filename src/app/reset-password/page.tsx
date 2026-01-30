'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { resetPassword } from '@/lib/auth-actions';

function ResetForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    if (!token) {
        return <div style={{ color: 'red' }}>Invalid Link: No token provided.</div>;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setStatus('error');
            setMessage("Passwords request do not match.");
            return;
        }

        if (password.length < 6) {
            setStatus('error');
            setMessage("Password must be at least 6 characters.");
            return;
        }

        setStatus('loading');
        setMessage('');

        const result = await resetPassword(token, password);

        if (result.success) {
            setStatus('success');
            setMessage(result.message || 'Password reset successful!');
            setTimeout(() => router.push('/admin/login'), 2000);
        } else {
            setStatus('error');
            setMessage(result.message || 'Failed to reset password.');
        }
    };

    return (
        <>
            <h1 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', color: '#333' }}>Set New Password</h1>
            <p style={{ marginBottom: '2rem', color: '#666' }}>Secure your account with a new password.</p>

            {status === 'success' ? (
                <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    ✅ {message}
                    <br />
                    <small>Redirecting to login...</small>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                        <label htmlFor="pass" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#444' }}>New Password</label>
                        <input
                            id="pass"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Min 6 chars"
                            style={{
                                width: '100%', padding: '0.8rem', borderRadius: '8px',
                                border: '1px solid #ddd', fontSize: '1rem'
                            }}
                        />
                    </div>
                    <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                        <label htmlFor="confirm" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#444' }}>Confirm Password</label>
                        <input
                            id="confirm"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            style={{
                                width: '100%', padding: '0.8rem', borderRadius: '8px',
                                border: '1px solid #ddd', fontSize: '1rem'
                            }}
                        />
                    </div>

                    {status === 'error' && (
                        <div style={{ color: '#d32f2f', marginBottom: '1rem', fontSize: '0.9rem' }}>
                            ⚠️ {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        style={{
                            width: '100%', padding: '0.9rem', borderRadius: '8px', border: 'none',
                            background: 'var(--primary, #2E7D32)', color: 'white', fontSize: '1rem', fontWeight: 'bold',
                            cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                            opacity: status === 'loading' ? 0.7 : 1
                        }}
                    >
                        {status === 'loading' ? 'Resetting...' : 'Update Password'}
                    </button>
                </form>
            )}
            <div style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>
                <Link href="/admin/login" style={{ color: '#666', textDecoration: 'none' }}>
                    Cancel
                </Link>
            </div>
        </>
    );
}

export default function ResetPasswordPage() {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center',
            minHeight: '100vh', padding: '20px', background: '#f5f5f5'
        }}>
            <div style={{
                background: 'white', padding: '2.5rem', borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px',
                textAlign: 'center'
            }}>
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                    <Image
                        src="/brand/logo.png"
                        alt="Budgalong Logo"
                        width={60}
                        height={60}
                        style={{ borderRadius: '12px' }}
                    />
                </div>
                <Suspense fallback={<div>Loading token...</div>}>
                    <ResetForm />
                </Suspense>
            </div>
        </div>
    );
}
