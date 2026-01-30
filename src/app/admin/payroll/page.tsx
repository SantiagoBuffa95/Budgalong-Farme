"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./payroll.module.css";
import { getTimesheets } from "@/lib/actions";
import { processSingleTimesheet, rejectTimesheet, regeneratePayslipPdf } from "@/lib/payroll-actions";
import Image from "next/image";

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



    const handleApproveAndPay = async () => {
        if (!selectedTs) return;
        if (!confirm(`Confirm Pay Run for ${selectedTs.employeeName}? This will generate a payslip and mark as paid.`)) return;

        setIsProcessing(true);
        try {
            const result = await processSingleTimesheet(selectedTs.id);
            if (result.success) {
                alert(result.message);
                setSelectedTs(null);
                refresh();
            } else {
                alert("Error: " + result.message);
            }
        } catch (err) {
            alert("Approval failed.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedTs) return;
        if (!confirm(`Reject timesheet for ${selectedTs.employeeName}? They will need to correct and resubmit.`)) return;

        setIsProcessing(true);
        try {
            const result = await rejectTimesheet(selectedTs.id);
            if (result.success) {
                alert(result.message);
                setSelectedTs(null);
                refresh();
            } else {
                alert("Error: " + result.message);
            }
        } catch (err) {
            alert("Rejection failed.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = async (tsId: string, employeeName: string) => {
        setIsProcessing(true);
        try {
            const res = await regeneratePayslipPdf(tsId);
            if (res.success && res.pdfBase64) {
                const byteCharacters = atob(res.pdfBase64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Payslip_${employeeName}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                alert("Failed to download: " + (res.message || "Unknown error"));
            }
        } catch (e) {
            console.error(e);
            alert("Download error");
        } finally {
            setIsProcessing(false);
        }
    };

    const refresh = async () => {
        const tsData = await getTimesheets();
        setTimesheets(tsData);
    };

    if (isLoading) return (
        <div className="container flex-center" style={{ minHeight: '80vh', flexDirection: 'column' }}>
            <Image src="/brand/logo.png" alt="Loading" width={100} height={100} className="spinner" style={{ borderRadius: '20px' }} />
            <p style={{ marginTop: '2rem', color: '#666', fontWeight: 'bold' }}>Gathering Budgalong Payroll Data...</p>
        </div>
    );

    const pending = timesheets.filter(t => t.status === 'Pending');
    const processed = timesheets.filter(t => t.status === 'Paid' || t.status === 'Approved');
    const rejected = timesheets.filter(t => t.status === 'Rejected');

    return (
        <div className="container">
            <header className={styles.header}>
                <Link href="/admin" className="btn btn-secondary">← Back to Home</Link>
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

            {rejected.length > 0 && (
                <section style={{ marginBottom: '3rem' }}>
                    <h2 className={styles.sectionTitle}>🔴 Rejected / Returned ({rejected.length})</h2>
                    <div className="grid-auto">
                        {rejected.map((ts: any) => (
                            <div key={ts.id} className="card" style={{ opacity: 0.7 }}>
                                <h3>{ts.employeeName}</h3>
                                <p>Week Ending: {ts.weekEnding}</p>
                                <p>Status: <span style={{ color: 'red' }}>Rejected</span></p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

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

                        {/* Cost Estimator Box */}
                        <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '2px solid #ddd', borderRadius: '8px', background: '#fff' }}>
                            <h3 style={{ margin: '0 0 1rem 0', color: '#555', fontSize: '1.1rem' }}>💰 Pay Run Details</h3>

                            {selectedTs.financials && selectedTs.financials.gross > 0 ? (
                                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', color: '#666' }}>Gross Pay</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>${selectedTs.financials.gross.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', color: '#666' }}>Superannuation</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>${selectedTs.financials.super.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', color: '#666' }}>Tax (PAYG)</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#d32f2f' }}>${selectedTs.financials.tax.toFixed(2)}</div>
                                    </div>
                                    <div style={{ paddingLeft: '1rem', borderLeft: '2px solid #eee' }}>
                                        <div style={{ fontSize: '0.9rem', color: '#666' }}>Net Pay</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                            ${selectedTs.financials.net.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p style={{ color: '#888', fontStyle: 'italic' }}>
                                    Legacy timesheet (no financial snapshot saved). <br />
                                    <small>Numbers will be calculated upon approval.</small>
                                </p>
                            )}
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

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                            <button className="btn btn-secondary" onClick={() => setSelectedTs(null)} disabled={isProcessing}>Close</button>

                            {selectedTs.status === 'Pending' && (
                                <button
                                    className="btn"
                                    onClick={handleReject}
                                    disabled={isProcessing}
                                    style={{ background: '#d32f2f', color: 'white', border: 'none' }}
                                >
                                    Reject & Return
                                </button>
                            )}

                            {selectedTs.status === 'Pending' && (
                                <button className="btn btn-primary" onClick={handleApproveAndPay} disabled={isProcessing}>
                                    {isProcessing ? 'Processing...' : 'Approve & Pay (Generate Slip)'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <section>
                <h2 className={styles.sectionTitle}>✅ Processed / Finalized</h2>
                <div className="card">
                    {processed.length === 0 ? (
                        <p style={{ color: '#999' }}>No processed payments yet.</p>
                    ) : (
                        <ul className={styles.infoList}>
                            {processed.map((ts: any) => (
                                <li key={ts.id} style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{ts.employeeName} - {ts.weekEnding} (Status: {ts.status})</span>
                                    <button
                                        className="btn-sm"
                                        onClick={() => handleDownload(ts.id, ts.employeeName)}
                                        style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.25rem 0.7rem', borderRadius: '4px', cursor: 'pointer' }}
                                        disabled={isProcessing}
                                    >
                                        📥 Download PDF
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>
        </div>
    );
}
