
"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./demo.module.css";

// Replicating basic types for the form state
interface DemoEntry {
    id: string; // Internal ID for React keys
    date: string;
    startTime: string;
    endTime: string;
    breakMinutes: number;
    isNightShift: boolean;
    isPublicHoliday: boolean;
}

interface DemoContract {
    baseRateHourly: number;
    classification: string;
    type: string;
    allowances: {
        dog: boolean;
        horse: boolean;
        firstAid: boolean;
        meal: boolean;
    };
}

export default function DemoPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    // Initial State
    const [contract, setContract] = useState<DemoContract>({
        baseRateHourly: 35.00,
        classification: "L1",
        type: "casual",
        allowances: {
            dog: false,
            horse: false,
            firstAid: false,
            meal: false
        }
    });

    const [entries, setEntries] = useState<DemoEntry[]>([
        { id: '1', date: '2026-05-04', startTime: '07:00', endTime: '15:30', breakMinutes: 30, isNightShift: false, isPublicHoliday: false },
        { id: '2', date: '2026-05-05', startTime: '07:00', endTime: '15:30', breakMinutes: 30, isNightShift: false, isPublicHoliday: false },
        { id: '3', date: '2026-05-06', startTime: '07:00', endTime: '15:30', breakMinutes: 30, isNightShift: false, isPublicHoliday: false },
    ]);

    const handleCalculate = async () => {
        setIsLoading(true);
        setResult(null);
        try {
            // Transform entries to match API expectation
            const apiEntries = entries.map(e => ({
                date: new Date(e.date),
                startTime: new Date(`${e.date}T${e.startTime}`),
                endTime: new Date(`${e.date}T${e.endTime}`),
                breakMinutes: e.breakMinutes,
                isNightShift: e.isNightShift,
                isPublicHoliday: e.isPublicHoliday
            }));

            const res = await fetch('/api/demo/calc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entries: apiEntries, contract })
            });

            if (!res.ok) throw new Error("Calculation failed");
            const data = await res.json();
            setResult(data);
        } catch (err) {
            console.error(err);
            alert("Error calculating pay. Please check inputs.");
        } finally {
            setIsLoading(false);
        }
    };

    const addEntry = () => {
        const id = Math.random().toString(36).substr(2, 9);
        setEntries([...entries, { id, date: '2026-05-07', startTime: '07:00', endTime: '15:30', breakMinutes: 30, isNightShift: false, isPublicHoliday: false }]);
    };

    const removeEntry = (id: string) => {
        setEntries(entries.filter(e => e.id !== id));
    };

    const updateEntry = (id: string, field: keyof DemoEntry, value: any) => {
        setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
    };

    const updateAllowance = (key: keyof typeof contract.allowances) => {
        setContract({
            ...contract,
            allowances: { ...contract.allowances, [key]: !contract.allowances[key] }
        });
    };

    return (
        <main className="container" style={{ paddingBottom: '4rem' }}>
            {/* Header */}
            <div style={{ padding: '2rem 0', textAlign: 'center' }}>
                <span style={{ background: '#FFEB3B', padding: '0.5rem 1rem', border: '2px solid #000', fontWeight: 'bold' }}>
                    🚧 PUBLIC RESULTS DEMO (NO LOGIN)
                </span>
                <h1 style={{ marginTop: '1rem' }}>Payroll Simulator</h1>
                <p>Try Budgalong&apos;s powerful engine without an account.</p>
                <Link href="/" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
                    ← Back to Home
                </Link>
            </div>

            <div className={styles.demoGrid}>
                {/* SETTINGS COLUMN */}
                <div className="card">
                    <h2>1. Settings</h2>
                    <div className={styles.formGroup}>
                        <label>Base Rate ($/hr)</label>
                        <input
                            type="number"
                            value={contract.baseRateHourly}
                            onChange={(e) => setContract({ ...contract, baseRateHourly: parseFloat(e.target.value) })}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Type</label>
                        <select
                            value={contract.type}
                            onChange={(e) => setContract({ ...contract, type: e.target.value })}
                        >
                            <option value="casual">Casual (25% Loading)</option>
                            <option value="full_time">Full Time</option>
                            <option value="part_time">Part Time</option>
                        </select>
                    </div>

                    <h3>Allowances</h3>
                    <div className={styles.toggles}>
                        <label className={styles.checkbox}>
                            <input type="checkbox" checked={contract.allowances.dog} onChange={() => updateAllowance('dog')} />
                            Dog ($10)
                        </label>
                        <label className={styles.checkbox}>
                            <input type="checkbox" checked={contract.allowances.horse} onChange={() => updateAllowance('horse')} />
                            Horse ($15)
                        </label>
                        <label className={styles.checkbox}>
                            <input type="checkbox" checked={contract.allowances.meal} onChange={() => updateAllowance('meal')} />
                            Meal ($15)
                        </label>
                        <label className={styles.checkbox}>
                            <input type="checkbox" checked={contract.allowances.firstAid} onChange={() => updateAllowance('firstAid')} />
                            First Aid ($5)
                        </label>
                    </div>
                </div>

                {/* TIMESHEET COLUMN */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2>2. Timesheet</h2>
                        <button onClick={addEntry} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>+ Add Row</button>
                    </div>

                    <div className={styles.timesheetList}>
                        {entries.map((entry) => (
                            <div key={entry.id} className={styles.entryRow}>
                                <div className={styles.rowTop}>
                                    <input type="date" value={entry.date} onChange={(e) => updateEntry(entry.id, 'date', e.target.value)} />
                                    <input type="time" value={entry.startTime} onChange={(e) => updateEntry(entry.id, 'startTime', e.target.value)} />
                                    <span>to</span>
                                    <input type="time" value={entry.endTime} onChange={(e) => updateEntry(entry.id, 'endTime', e.target.value)} />
                                </div>
                                <div className={styles.rowBottom}>
                                    <label>Break (min): <input type="number" style={{ width: '50px' }} value={entry.breakMinutes} onChange={(e) => updateEntry(entry.id, 'breakMinutes', parseInt(e.target.value))} /></label>
                                    <label><input type="checkbox" checked={entry.isNightShift} onChange={(e) => updateEntry(entry.id, 'isNightShift', e.target.checked)} /> Night</label>
                                    <label><input type="checkbox" checked={entry.isPublicHoliday} onChange={(e) => updateEntry(entry.id, 'isPublicHoliday', e.target.checked)} /> PH</label>
                                    <button onClick={() => removeEntry(entry.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button onClick={handleCalculate} className="btn btn-primary" style={{ width: '100%', marginTop: '2rem' }} disabled={isLoading}>
                        {isLoading ? "Running Engine..." : "CALCULATE PAY"}
                    </button>
                </div>

                {/* RESULTS COLUMN */}
                <div className="card" style={{ background: '#2D312B', color: '#FDFBF7' }}>
                    <h2 style={{ color: '#FDFBF7' }}>3. Results</h2>

                    {!result && (
                        <div style={{ textAlign: 'center', marginTop: '3rem', opacity: 0.5 }}>
                            <p>Enter data and click Calculate</p>
                        </div>
                    )}

                    {result && (
                        <div className={styles.results}>
                            <div className={styles.bigTotal}>
                                <span>NET PAY</span>
                                <strong>${result.net.toFixed(2)}</strong>
                            </div>

                            <div className={styles.summaryGrid}>
                                <div>Gross: ${result.gross.toFixed(2)}</div>
                                <div>Tax: ${result.tax.toFixed(2)}</div>
                                <div>Super: ${result.super.toFixed(2)}</div>
                            </div>

                            <hr style={{ borderColor: '#555', margin: '1rem 0' }} />

                            <table style={{ width: '100%', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #555' }}>
                                        <th style={{ padding: '0.5rem 0' }}>Item</th>
                                        <th>Units</th>
                                        <th style={{ textAlign: 'right' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.lines.map((line: any, i: number) => (
                                        <tr key={i} style={{ borderBottom: '1px dashed #444' }}>
                                            <td style={{ padding: '0.5rem 0' }}>{line.description}</td>
                                            <td>{line.units.toFixed(2)}</td>
                                            <td style={{ textAlign: 'right' }}>${line.amount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
