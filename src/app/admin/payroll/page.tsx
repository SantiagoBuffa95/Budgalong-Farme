"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./payroll.module.css";
import { getTimesheets, getContracts, approveTimesheet } from "@/lib/actions";
import { calculateWeeklyPay } from "@/lib/payroll";
import { generatePaySlipPDF } from "@/lib/pdf";
import { Contract, WeeklyTimesheet } from "@/lib/types";

export default function AdminPayrollPage() {
    const [timesheets, setTimesheets] = useState<WeeklyTimesheet[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTs, setSelectedTs] = useState<WeeklyTimesheet | null>(null);

    useEffect(() => {
        async function load() {
            const [tsData, contractData] = await Promise.all([
                getTimesheets(),
                getContracts()
            ]);
            setTimesheets(tsData);
            setContracts(contractData);
            setIsLoading(false);
        }
        load();
    }, []);

    const handleProcess = async (ts: WeeklyTimesheet) => {
        const contract = contracts.find(c => c.id === ts.employeeId);
        if (!contract) {
            alert("Error: Employee contract not found!");
            return;
        }

        try {
            // 1. Calculate
            const payslip = calculateWeeklyPay(contract, ts.entries);

            // 2. Generate PDF
            generatePaySlipPDF(contract, payslip);

            // 3. Mark as Approved/Paid
            const result = await approveTimesheet(ts.id);
            if (result.success) {
                setTimesheets(prev => prev.map(item => item.id === ts.id ? { ...item, status: 'Approved' } : item));
                alert("Payroll processed and PDF downloaded!");
                setSelectedTs(null);
            } else {
                alert("Failed to update status in database.");
            }
        } catch (err) {
            console.error("Processing error:", err);
            alert("An error occurred while processing payroll. Check console.");
        }
    };

    if (isLoading) return <div className="container">Loading...</div>;

    const pending = timesheets.filter(t => t.status === 'Pending');
    const approved = timesheets.filter(t => t.status === 'Approved');

    return (
        <div className="container">
            <header className={styles.header}>
                <Link href="/admin" className={styles.backLink}>← Back to Home</Link>
                <h1>Weekly Payroll Processing</h1>
                <p>Review and approve weekly hours submitted by staff.</p>
            </header>

            <section style={{ marginBottom: '3rem' }}>
                <h2 className={styles.sectionTitle}>⏳ Pending Approvals ({pending.length})</h2>
                {pending.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', color: '#666' }}>
                        No pending timesheets to approve.
                    </div>
                ) : (
                    <div className="grid-auto">
                        {pending.map(ts => (
                            <div key={ts.id} className="card" onClick={() => setSelectedTs(ts)} style={{ cursor: 'pointer', borderColor: selectedTs?.id === ts.id ? 'var(--primary)' : 'transparent' }}>
                                <h3>{ts.employeeName}</h3>
                                <p>Week Ending: <strong>{ts.weekEnding}</strong></p>
                                <p>Days worked: {ts.entries.length}</p>
                                <div style={{ marginTop: '1rem', color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                    👉 Click to Review & Approve
                                </div>
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
                            <p><strong>Submitted:</strong> {new Date(selectedTs.submittedAt).toLocaleString()}</p>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                            <thead>
                                <tr style={{ background: '#eee', textAlign: 'left' }}>
                                    <th style={{ padding: '8px' }}>Date</th>
                                    <th style={{ padding: '8px' }}>Time</th>
                                    <th style={{ padding: '8px' }}>Break</th>
                                    <th style={{ padding: '8px' }}>Activity</th>
                                    <th style={{ padding: '8px' }}>Flags</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedTs.entries.map((entry, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '8px' }}>{entry.date}</td>
                                        <td style={{ padding: '8px' }}>{entry.startTime} - {entry.endTime}</td>
                                        <td style={{ padding: '8px' }}>{entry.breakMinutes}m</td>
                                        <td style={{ padding: '8px' }}>{entry.activity}</td>
                                        <td style={{ padding: '8px' }}>
                                            {entry.isNightShift && <span style={{ marginRight: '5px' }}>🌙</span>}
                                            {entry.isPublicHoliday && <span>🎉</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setSelectedTs(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={() => handleProcess(selectedTs)}>✅ Approve & Generate PDF</button>
                        </div>
                    </div>
                </div>
            )}

            <section>
                <h2 className={styles.sectionTitle}>✅ Recently Processed</h2>
                <div className="card">
                    {approved.length === 0 ? (
                        <p style={{ color: '#999' }}>No processed payments in this session.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                                    <th style={{ padding: '0.5rem' }}>Employee</th>
                                    <th style={{ padding: '0.5rem' }}>Date</th>
                                    <th style={{ padding: '0.5rem' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {approved.map(ts => (
                                    <tr key={ts.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '0.8rem' }}>{ts.employeeName}</td>
                                        <td style={{ padding: '0.8rem' }}>{ts.weekEnding}</td>
                                        <td style={{ padding: '0.8rem' }}>
                                            <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                APPROVED
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>
        </div>
    );
}
