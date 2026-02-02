"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./timesheet.module.css";
import { saveTimesheet, getMyContract } from "@/lib/actions";
import { previewPay } from "@/lib/payroll-actions";
import { TimesheetEntry, Contract } from "@/lib/types";

export default function TimesheetPage() {
    const router = useRouter();
    const [entries, setEntries] = useState<TimesheetEntry[]>([]);
    const [employee, setEmployee] = useState<Contract | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Auto-hide notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Preview State
    const [previewSlip, setPreviewSlip] = useState<any | null>(null);
    const [calculating, setCalculating] = useState(false);

    useEffect(() => {
        async function load() {
            // Get the contract for the CURRENT logged-in user
            const myContract = await getMyContract();
            setEmployee(myContract);
            setIsLoading(false);
        }
        load();
    }, []);

    // Calculate pay whenever entries or employee changes (Debounced)
    useEffect(() => {
        if (employee && entries.length > 0) {
            setCalculating(true);
            const timer = setTimeout(async () => {
                const res = await previewPay(entries.map(e => ({
                    ...e,
                    date: new Date(e.date),
                    startTime: new Date(`${e.date}T${e.startTime}`),
                    endTime: new Date(`${e.date}T${e.endTime}`)
                })), employee.employeeId);

                if (res.success) {
                    setPreviewSlip(res.result);
                }
                setCalculating(false);
            }, 800); // 800ms debounce

            return () => clearTimeout(timer);
        } else {
            setPreviewSlip(null);
        }
    }, [entries, employee]);

    const addDay = () => {
        const newEntry: TimesheetEntry = {
            date: new Date().toISOString().split('T')[0],
            startTime: "09:00",
            endTime: "17:00",
            breakMinutes: 60,
            isNightShift: false,
            isPublicHoliday: false,
            activity: "General Farm Hand"
        };
        setEntries([...entries, newEntry]);
    };

    const updateEntry = (index: number, field: string, value: any) => {
        const newEntries = [...entries];
        newEntries[index] = { ...newEntries[index], [field]: value };
        setEntries(newEntries);
    };

    const removeEntry = (index: number) => {
        setEntries(entries.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!employee || entries.length === 0) return;

        setIsSubmitting(true);
        const result = await saveTimesheet({
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            weekEnding: entries[entries.length - 1].date,
            entries: entries
        });

        if (result.success) {
            setNotification({ type: 'success', message: "Weekly hours submitted for approval!" });
            setTimeout(() => router.push("/employee"), 2000); // Redirect after delay
        } else {
            setNotification({ type: 'error', message: "Error: " + result.message });
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="container flex-center">Loading...</div>;
    if (!employee) return (
        <div className="container flex-center">
            <div className="card" style={{ textAlign: 'center' }}>
                <h2>No Active Contract Found</h2>
                <p>Please go to Admin to Staff Management and create a contract first.</p>
                <Link href="/" className="btn btn-secondary">Go Home</Link>
            </div>
        </div>
    );

    return (
        <div className="container">
            <header className={styles.header}>
                <Link href="/employee" className="btn btn-secondary">← Back to Profile</Link>
                <h1>Log My Weekly Hours</h1>
                <p>Worker: <strong>{employee.firstName} {employee.lastName}</strong></p>
                {employee.baseRate === 0 && (
                    <div style={{ background: '#fff3cd', color: '#856404', padding: '0.5rem', borderRadius: '4px', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                        ⚠️ No Pay Rate found. Please ask Admin to set up your Contract.
                    </div>
                )}
            </header>

            <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '100px' }}>
                <form onSubmit={handleSubmit}>
                    {entries.length === 0 && (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                            <p>No days added yet for this week.</p>
                            <button type="button" className="btn btn-primary" onClick={addDay}>
                                + Add First Work Day
                            </button>
                        </div>
                    )}

                    {entries.map((entry, index) => (
                        <div key={index} className="card" style={{ marginBottom: '1.5rem', position: 'relative' }}>
                            <button
                                type="button"
                                onClick={() => removeEntry(index)}
                                style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
                            >
                                ❌
                            </button>

                            <div className={styles.gridRow}>
                                <div className={styles.inputGroup}>
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        value={entry.date}
                                        onChange={(e) => updateEntry(index, 'date', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Start</label>
                                    <input
                                        type="time"
                                        value={entry.startTime}
                                        onChange={(e) => updateEntry(index, 'startTime', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>End</label>
                                    <input
                                        type="time"
                                        value={entry.endTime}
                                        onChange={(e) => updateEntry(index, 'endTime', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Break (min)</label>
                                    <input
                                        type="number"
                                        value={entry.breakMinutes}
                                        onChange={(e) => updateEntry(index, 'breakMinutes', parseInt(e.target.value) || 0)}
                                    />
                                </div>
                            </div>

                            <div className={styles.gridRow} style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                                <div className={styles.inputGroup} style={{ flex: 2 }}>
                                    <label>Daily Tasks / Activity Log</label>
                                    <textarea
                                        value={entry.activity}
                                        onChange={(e) => updateEntry(index, 'activity', e.target.value)}
                                        placeholder="Describe what you did today (e.g. Mustering ram paddock, Crutching, Fix fence near creek)"
                                        style={{ minHeight: '80px', padding: '0.8rem', borderRadius: '12px', border: '3px solid #000', fontFamily: 'inherit' }}
                                    />
                                </div>
                                <div className={styles.togglesRow} style={{ flex: 1, display: 'flex', gap: '15px', alignItems: 'flex-start', paddingTop: '1.8rem' }}>
                                    <label className={styles.checkbox}>
                                        <input
                                            type="checkbox"
                                            checked={entry.isNightShift}
                                            onChange={(e) => updateEntry(index, 'isNightShift', e.target.checked)}
                                        />
                                        <span>Night</span>
                                    </label>
                                    <label className={styles.checkbox}>
                                        <input
                                            type="checkbox"
                                            checked={entry.isPublicHoliday}
                                            onChange={(e) => updateEntry(index, 'isPublicHoliday', e.target.checked)}
                                        />
                                        <span>PH</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    ))}

                    {entries.length > 0 && (
                        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                            <button type="button" className="btn btn-secondary" onClick={addDay} style={{ marginRight: '10px' }}>
                                + Add Another Day
                            </button>
                            <button type="submit" className="btn btn-primary" style={{ minWidth: '200px' }}>
                                Submit Weekly Log
                            </button>
                        </div>
                    )}
                </form>
            </div>

            {/* Estimated Pay Summary - Sticky Footer */}
            {previewSlip && (
                <div style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    background: '#fff', borderTop: '4px solid var(--primary)',
                    padding: '1rem', boxShadow: '0 -4px 10px rgba(0,0,0,0.1)',
                    zIndex: 100
                }}>
                    <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '900px', flexWrap: 'wrap', gap: '1rem' }}>

                        <div style={{ display: 'flex', gap: '2rem', flex: 1 }}>
                            <div>
                                <span style={{ fontSize: '0.8rem', color: '#666', display: 'block' }}>Gross Pay</span>
                                <strong style={{ fontSize: '1.2rem', color: '#333' }}>${previewSlip.gross.toFixed(2)}</strong>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.8rem', color: '#666', display: 'block' }}>Super (11.5%)</span>
                                <strong style={{ fontSize: '1.2rem', color: '#333' }}>${previewSlip.super.toFixed(2)}</strong>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.8rem', color: '#666', display: 'block' }}>Tax (est)</span>
                                <strong style={{ fontSize: '1.2rem', color: '#d32f2f' }}>${previewSlip.tax.toFixed(2)}</strong>
                            </div>
                        </div>

                        <div style={{ textAlign: 'right', borderLeft: '2px solid #eee', paddingLeft: '1rem' }}>
                            <span style={{ fontSize: '0.9rem', color: '#666', display: 'block' }}>Net Pay (In Pocket)</span>
                            <strong style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>${previewSlip.net.toFixed(2)}</strong>
                        </div>
                    </div>
                </div>
            )}
            {/* NOTIFICATION TOAST */}
            {notification && (
                <div style={{
                    position: 'fixed', bottom: '80px', right: '20px', // Raised above sticky footer
                    padding: '1rem 1.5rem', borderRadius: '8px',
                    color: '#fff',
                    backgroundColor: notification.type === 'success' ? '#2e7d32' : '#d32f2f',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 9999,
                    animation: 'fadeIn 0.3s'
                }}>
                    <strong>{notification.type === 'success' ? 'Success' : 'Error'}</strong>: {notification.message}
                </div>
            )}
        </div>
    );
}
