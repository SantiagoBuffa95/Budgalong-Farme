'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { requestPasswordReset } from '@/lib/auth-actions';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        const result = await requestPasswordReset(email);

        if (result.success) {
            setStatus('success');
            setMessage(result.message || 'Check your email for the reset link.');
        } else {
            setStatus('error');
            setMessage(result.message || 'Something went wrong.');
        }
    };

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

                <h1 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', color: '#333' }}>Forgot Password?</h1>
                <p style={{ marginBottom: '2rem', color: '#666' }}>Enter your email to receive a reset link.</p>

                {status === 'success' ? (
                    <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                        ✅ {message}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#444' }}>Email Address</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@farm.com"
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
                            {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                )}

                <div style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>
                    <Link href="/" style={{ color: '#666', textDecoration: 'none' }}>
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
