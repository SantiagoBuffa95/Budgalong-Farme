"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./timesheet.module.css";
import { saveTimesheet, getContracts } from "@/lib/actions";
import { TimesheetEntry, Contract, PaySlip } from "@/lib/types";
import { calculateWeeklyPay } from "@/lib/payroll";

export default function TimesheetPage() {
    const router = useRouter();
    const [entries, setEntries] = useState<TimesheetEntry[]>([]);
    const [employee, setEmployee] = useState<Contract | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [previewSlip, setPreviewSlip] = useState<PaySlip | null>(null);

    useEffect(() => {
        async function load() {
            const contracts = await getContracts();
            if (contracts.length > 0) {
                setEmployee(contracts[contracts.length - 1]);
            }
            setIsLoading(false);
        }
        load();
    }, []);

    // Calculate pay whenever entries or employee changes
    useEffect(() => {
        if (employee && entries.length > 0) {
            const slip = calculateWeeklyPay(employee, entries);
            setPreviewSlip(slip);
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

        const result = await saveTimesheet({
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            weekEnding: entries[entries.length - 1].date,
            entries: entries
        });

        if (result.success) {
            alert("Weekly hours submitted for approval!");
            router.push("/employee");
        } else {
            alert("Error: " + result.message);
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
                <Link href="/employee" className={styles.backLink}>← Back to Profile</Link>
                <h1>Log My Weekly Hours</h1>
                <p>Worker: <strong>{employee.firstName} {employee.lastName}</strong></p>
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
                    <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '900px' }}>
                        <div>
                            <span style={{ fontSize: '0.9rem', color: '#666', display: 'block' }}>Estimated Gross Pay</span>
                            <strong style={{ fontSize: '1.5rem', color: 'var(--foreground)' }}>${previewSlip.grossPay.toFixed(2)}</strong>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.9rem', color: '#666', display: 'block' }}>Net Pay (Take Home)</span>
                            <strong style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>${previewSlip.netPay.toFixed(2)}</strong>
                        </div>
                    </div>

                    {/* Expandable Details (Optional, kept simple for now) */}
                    <div className="container" style={{ maxWidth: '900px', marginTop: '0.5rem', fontSize: '0.8rem', color: '#888' }}>
                        * Includes overtime, penalties & allowances. Tax is estimated.
                    </div>
                </div>
            )}
        </div>
    );
}
