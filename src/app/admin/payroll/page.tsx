"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./payroll.module.css";
import { getTimesheets, getContracts } from "@/lib/actions";
import { createPayRun } from "@/lib/payroll-actions";

export default function AdminPayrollPage() {
    const [timesheets, setTimesheets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTs, setSelectedTs] = useState<any | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        async function load() {
            const tsData = await getTimesheets();
            setTimesheets(tsData);
            setIsLoading(false);
        }
        load();
    }, []);

    const handleProcessAll = async () => {
        if (!confirm("Start Pay Run for all approved timesheets?")) return;

        setIsProcessing(true);
        try {
            // MVP: Using a fixed period for demo, usually controlled by date picker
            const start = new Date();
            start.setDate(start.getDate() - 7);
            const end = new Date();

            const result = await createPayRun(start, end);
            if (result.success) {
                alert(`Pay Run successful! Created ${result.count} payslips.`);
                // Refresh data
                const tsData = await getTimesheets();
                setTimesheets(tsData);
            } else {
                alert("Error: " + result.message);
            }
        } catch (err) {
            alert("Processing failed.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) return <div className="container" style={{ padding: '2rem' }}>Loading...</div>;

    const pending = timesheets.filter(t => t.status === 'Pending' || t.status === 'submitted');
    const approved = timesheets.filter(t => t.status === 'Approved' || t.status === 'paid');

    return (
        <div className="container">
            <header className={styles.header}>
                <Link href="/admin" className={styles.backLink}>← Back to Home</Link>
                <h1>Weekly Payroll Processing</h1>
                <p>Review and approve weekly hours submitted by staff.</p>
                <div style={{ marginTop: '1rem' }}>
                    <button
                        className="btn btn-primary"
                        onClick={handleProcessAll}
                        disabled={isProcessing || pending.length === 0}
                    >
                        {isProcessing ? 'Processing...' : `🚀 Start Pay Run for ${pending.length} Staff`}
                    </button>
                </div>
            </header>

            <section style={{ marginBottom: '3rem' }}>
                <h2 className={styles.sectionTitle}>⏳ Pending Approvals ({pending.length})</h2>
                {pending.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', color: '#666' }}>
                        No pending timesheets to approve.
                    </div>
                ) : (
                    <div className="grid-auto">
                        {pending.map((ts: any) => (
                            <div key={ts.id} className="card" onClick={() => setSelectedTs(ts)} style={{ cursor: 'pointer', borderColor: selectedTs?.id === ts.id ? 'var(--primary)' : 'transparent' }}>
                                <h3>{ts.employeeName}</h3>
                                <p>Week Ending: <strong>{ts.weekEnding}</strong></p>
                                <p>Status: <span style={{ color: 'orange' }}>{ts.status}</span></p>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Modal for Details */}
            {selectedTs && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0 }}>Review Timesheet</h2>
                            <button onClick={() => setSelectedTs(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✖</button>
                        </div>

                        <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
                            <p><strong>Employee:</strong> {selectedTs.employeeName}</p>
                            <p><strong>Week Ending:</strong> {selectedTs.weekEnding}</p>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                            <thead>
                                <tr style={{ background: '#eee', textAlign: 'left' }}>
                                    <th style={{ padding: '8px' }}>Date</th>
                                    <th style={{ padding: '8px' }}>Time</th>
                                    <th style={{ padding: '8px' }}>Break</th>
                                    <th style={{ padding: '8px' }}>Activity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedTs.entries.map((entry: any, i: number) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '8px' }}>{entry.date}</td>
                                        <td style={{ padding: '8px' }}>{entry.startTime} - {entry.endTime}</td>
                                        <td style={{ padding: '8px' }}>{entry.breakMinutes}m</td>
                                        <td style={{ padding: '8px' }}>{entry.activity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setSelectedTs(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            <section>
                <h2 className={styles.sectionTitle}>✅ Processed / Finalized</h2>
                <div className="card">
                    {approved.length === 0 ? (
                        <p style={{ color: '#999' }}>No processed payments yet.</p>
                    ) : (
                        <ul className={styles.infoList}>
                            {approved.map((ts: any) => (
                                <li key={ts.id} style={{ marginBottom: '0.5rem' }}>
                                    {ts.employeeName} - {ts.weekEnding} (Status: {ts.status})
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>
        </div>
    );
}
