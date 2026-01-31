"use client";

import { useState } from "react";
import { previewPayrollCalculation } from "@/lib/payroll-actions";
import Link from "next/link";
import { PayResult } from "@/lib/payroll/engine";

export default function PayrollCalculator() {
    const [calculating, setCalculating] = useState(false);
    const [result, setResult] = useState<PayResult | null>(null);
    const [error, setError] = useState("");

    // Form State
    const [contract, setContract] = useState({
        type: "casual",
        baseRate: 30.00,
        salaryAnnual: 0,
        classification: "Level 1",
        ordinaryHoursPerWeek: 38,
        overtimeMode: "award_default",
    });

    const [entries, setEntries] = useState([
        { date: new Date().toISOString().split('T')[0], startTime: "07:00", endTime: "16:00", breakMinutes: 30, isNightShift: false, isPublicHoliday: false }
    ]);

    const handleCalculate = async () => {
        setCalculating(true);
        setError("");

        try {
            const payload = {
                contract: {
                    ...contract,
                    baseRate: Number(contract.baseRate),
                    salaryAnnual: Number(contract.salaryAnnual),
                    ordinaryHoursPerWeek: Number(contract.ordinaryHoursPerWeek)
                },
                entries: entries
            };

            const res = await previewPayrollCalculation(payload);

            if (res.success) {
                setResult(res.result || null);
            } else {
                setError(res.message || "Calculation failed");
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setCalculating(false);
        }
    };

    const addEntry = () => {
        const lastDate = entries.length > 0 ? entries[entries.length - 1].date : new Date().toISOString().split('T')[0];
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + 1);

        setEntries([...entries, {
            date: nextDate.toISOString().split('T')[0],
            startTime: "07:00",
            endTime: "16:00",
            breakMinutes: 30,
            isNightShift: false,
            isPublicHoliday: false
        }]);
    };

    const updateEntry = (index: number, field: string, value: any) => {
        const newEntries = [...entries];
        newEntries[index] = { ...newEntries[index], [field]: value };
        setEntries(newEntries);
    };

    const removeEntry = (index: number) => {
        setEntries(entries.filter((_, i) => i !== index));
    };

    return (
        <div className="container">
            <header style={{ marginBottom: '2rem' }}>
                <Link href="/admin/payroll" className="btn btn-secondary">← Back</Link>
                <h1>Payroll Calculator (Preview)</h1>
                <p>Simulate pay calculations without saving data. Admin use only.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '20px', alignItems: 'start' }}>

                {/* LEFT: INPUTS */}
                <div>
                    <div className="card" style={{ marginBottom: '1rem' }}>
                        <h3>Contract Settings</h3>

                        <div style={{ marginBottom: '1rem' }}>
                            <label>Employment Type</label>
                            <select
                                value={contract.type}
                                onChange={e => setContract({ ...contract, type: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem' }}
                            >
                                <option value="casual">Casual</option>
                                <option value="part_time">Part Time</option>
                                <option value="full_time">Full Time</option>
                                <option value="contractor">Contractor (ABN)</option>
                                <option value="salary">Salary</option>
                            </select>
                        </div>

                        {contract.type === 'salary' ? (
                            <div style={{ marginBottom: '1rem' }}>
                                <label>Annual Salary ($)</label>
                                <input
                                    type="number"
                                    value={contract.salaryAnnual}
                                    onChange={e => setContract({ ...contract, salaryAnnual: parseFloat(e.target.value) })}
                                    style={{ width: '100%', padding: '0.5rem' }}
                                />
                            </div>
                        ) : (
                            <div style={{ marginBottom: '1rem' }}>
                                <label>Hourly Base Rate ($)</label>
                                <input
                                    type="number"
                                    value={contract.baseRate}
                                    onChange={e => setContract({ ...contract, baseRate: parseFloat(e.target.value) })}
                                    style={{ width: '100%', padding: '0.5rem' }}
                                />
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3>Shift Entries</h3>
                            <button onClick={addEntry} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '5px 10px' }}>+ Add Day</button>
                        </div>

                        {entries.length === 0 && <p style={{ color: '#888', fontStyle: 'italic' }}>No shifts added.</p>}

                        {entries.map((entry, index) => (
                            <div key={index} style={{ borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                                    <input type="date" value={entry.date} onChange={e => updateEntry(index, 'date', e.target.value)} style={{ flex: 1 }} />
                                    <button onClick={() => removeEntry(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red' }}>×</button>
                                </div>
                                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                    <input type="time" value={entry.startTime} onChange={e => updateEntry(index, 'startTime', e.target.value)} />
                                    <span>to</span>
                                    <input type="time" value={entry.endTime} onChange={e => updateEntry(index, 'endTime', e.target.value)} />
                                    <input type="number" placeholder="Break Min" value={entry.breakMinutes} onChange={e => updateEntry(index, 'breakMinutes', Number(e.target.value))} style={{ width: '60px' }} />
                                </div>
                                <div style={{ marginTop: '5px', display: 'flex', gap: '10px' }}>
                                    <label style={{ fontSize: '0.8rem' }}>
                                        <input type="checkbox" checked={entry.isPublicHoliday} onChange={e => updateEntry(index, 'isPublicHoliday', e.target.checked)} />
                                        Public Holiday
                                    </label>
                                    <label style={{ fontSize: '0.8rem' }}>
                                        <input type="checkbox" checked={entry.isNightShift} onChange={e => updateEntry(index, 'isNightShift', e.target.checked)} />
                                        Night Check
                                    </label>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={handleCalculate}
                            disabled={calculating}
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '1rem' }}
                        >
                            {calculating ? 'Calculating...' : 'Preview Pay'}
                        </button>

                        {error && <div style={{ color: 'red', marginTop: '1rem', whiteSpace: 'pre-wrap' }}>{error}</div>}
                    </div>
                </div>

                {/* RIGHT: RESULTS */}
                <div className="card" style={{ background: result ? '#f0f9ff' : '#fafafa' }}>
                    <h3 style={{ borderBottom: '2px solid #ddd', paddingBottom: '0.5rem' }}>Calculation Result</h3>

                    {!result ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                            Update settings and click &quot;Preview Pay&quot; to see results.
                        </div>
                    ) : (
                        <div style={{ marginTop: '1rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>
                                        <th style={{ padding: '5px' }}>Item</th>
                                        <th style={{ padding: '5px', textAlign: 'right' }}>Units</th>
                                        <th style={{ padding: '5px', textAlign: 'right' }}>Rate</th>
                                        <th style={{ padding: '5px', textAlign: 'right' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.lines.map((line, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '6px 5px' }}>{line.description}</td>
                                            <td style={{ padding: '6px 5px', textAlign: 'right' }}>{line.units.toFixed(2)}</td>
                                            <td style={{ padding: '6px 5px', textAlign: 'right' }}>{line.rate.toFixed(2)}</td>
                                            <td style={{ padding: '6px 5px', textAlign: 'right' }}>${line.amount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot style={{ fontWeight: 'bold' }}>
                                    <tr>
                                        <td colSpan={3} style={{ paddingTop: '10px', textAlign: 'right' }}>Gross Pay:</td>
                                        <td style={{ paddingTop: '10px', textAlign: 'right' }}>${result.gross.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'right', color: '#d32f2f' }}>PAYG Tax (est):</td>
                                        <td style={{ textAlign: 'right', color: '#d32f2f' }}>(${result.tax.toFixed(2)})</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'right', color: '#666' }}>Super (11.5%):</td>
                                        <td style={{ textAlign: 'right', color: '#666' }}>${result.super.toFixed(2)}</td>
                                    </tr>
                                    <tr style={{ fontSize: '1.2rem', color: '#2e7d32' }}>
                                        <td colSpan={3} style={{ paddingTop: '10px', textAlign: 'right' }}>NET PAYABLE:</td>
                                        <td style={{ paddingTop: '10px', textAlign: 'right' }}>${result.net.toFixed(2)}</td>
                                    </tr>
                                </tfoot>
                            </table>

                            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
                                * This is a preview only. No data is saved to the database.
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
