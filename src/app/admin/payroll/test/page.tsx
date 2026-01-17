"use client";

import { useState, useEffect } from "react";
import { calculateWeeklyPay } from "@/lib/payroll";
import { Contract, TimesheetEntry, PaySlip } from "@/lib/types";
import { getContracts } from "@/lib/actions"; // We need a client-safe way or pass via props. 
// Since getContracts is server action, we can't import it directly in client component easily without useEffect wrapper or passing as prop.
// For this test page, let's mock the contract for simpler testing or use a server component wrapper.

export default function PayrollTestPage() {
    const [contract, setContract] = useState<Contract>({
        id: "test", employeeId: "test", firstName: "Jack", lastName: "Shearer", email: "",
        type: "employee", classification: "FLH3", baseRate: 30.00, superannuation: true,
        allowances: { dog: true, horse: false, firstAid: false, meal: false },
        deductions: { accommodation: 50, meat: 0 },
        status: "Active", startDate: "2024-01-01"
    });

    const [timesheet, setTimesheet] = useState<TimesheetEntry[]>([
        { date: "2024-10-05", startTime: "07:00", endTime: "16:00", breakMinutes: 30, isNightShift: false, isPublicHoliday: false, activity: "General" }, // Mon
        { date: "2024-10-06", startTime: "07:00", endTime: "17:00", breakMinutes: 30, isNightShift: false, isPublicHoliday: false, activity: "General" }, // Tue (Overtime?)
        { date: "2024-10-12", startTime: "08:00", endTime: "12:00", breakMinutes: 0, isNightShift: false, isPublicHoliday: false, activity: "Weekend Work" }, // Sat
    ]);

    const [result, setResult] = useState<PaySlip | null>(null);

    useEffect(() => {
        const pay = calculateWeeklyPay(contract, timesheet);
        setResult(pay);
    }, [contract, timesheet]);

    const updateEntry = (index: number, field: string, val: any) => {
        const newTs = [...timesheet];
        newTs[index] = { ...newTs[index], [field]: val };
        setTimesheet(newTs);
    };

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <h1>🔮 Payroll Logic Tester</h1>
            <p>Modify the values below to test the calculation engine.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>

                {/* INPUTS */}
                <div>
                    <h3>Contract Parameters</h3>
                    <div className="card">
                        <label>Hourly Rate ($)</label>
                        <input type="number" value={contract.baseRate} onChange={e => setContract({ ...contract, baseRate: parseFloat(e.target.value) })} style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }} />

                        <label>
                            <input type="checkbox" checked={contract.type === 'contractor'} onChange={e => setContract({ ...contract, type: e.target.checked ? 'contractor' : 'employee' })} />
                            Is Contractor?
                        </label>
                        <br />
                        <label>
                            <input type="checkbox" checked={contract.allowances.dog} onChange={e => setContract({ ...contract, allowances: { ...contract.allowances, dog: e.target.checked } })} />
                            Dog Allowance
                        </label>
                    </div>

                    <h3>Timesheet Entries</h3>
                    {timesheet.map((entry, idx) => (
                        <div key={idx} className="card" style={{ marginBottom: '1rem', padding: '1rem', background: '#f9f9f9' }}>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                                <input type="date" value={entry.date} onChange={e => updateEntry(idx, 'date', e.target.value)} />
                                <input type="time" value={entry.startTime} onChange={e => updateEntry(idx, 'startTime', e.target.value)} />
                                to
                                <input type="time" value={entry.endTime} onChange={e => updateEntry(idx, 'endTime', e.target.value)} />

                                <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    <small>Break (mins)</small>
                                    <input type="number" value={entry.breakMinutes} onChange={e => updateEntry(idx, 'breakMinutes', parseInt(e.target.value) || 0)} style={{ width: '60px', padding: '5px' }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <label><input type="checkbox" checked={entry.isPublicHoliday} onChange={e => updateEntry(idx, 'isPublicHoliday', e.target.checked)} /> Pub Hol</label>
                                    <label><input type="checkbox" checked={entry.isNightShift} onChange={e => updateEntry(idx, 'isNightShift', e.target.checked)} /> Night</label>
                                </div>
                                <small style={{ color: '#666', fontStyle: 'italic' }}>
                                    Net: {((new Date(`1970-01-01T${entry.endTime}`).getTime() - new Date(`1970-01-01T${entry.startTime}`).getTime()) / 60000 - entry.breakMinutes) / 60} hrs
                                </small>
                            </div>
                        </div>
                    ))}
                    <button className="btn btn-secondary" onClick={() => setTimesheet([...timesheet, { date: "2024-10-10", startTime: "07:00", endTime: "16:00", breakMinutes: 30, isNightShift: false, isPublicHoliday: false, activity: "New" }])}>+ Add Day</button>
                </div>

                {/* OUTPUTS */}
                <div>
                    <h3>Calculation Result</h3>
                    {result && (
                        <div className="card" style={{ border: '3px solid var(--primary)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #eee' }}>
                                        <th style={{ textAlign: 'left' }}>Description</th>
                                        <th style={{ textAlign: 'right' }}>Units</th>
                                        <th style={{ textAlign: 'right' }}>Rate</th>
                                        <th style={{ textAlign: 'right' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.items.map((item, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <td style={{ padding: '0.5rem 0' }}>{item.description}</td>
                                            <td style={{ textAlign: 'right' }}>{item.units}</td>
                                            <td style={{ textAlign: 'right' }}>${item.rate.toFixed(2)}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>${item.total.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot style={{ borderTop: '2px solid #000' }}>
                                    <tr>
                                        <td colSpan={3} style={{ paddingTop: '1rem', fontWeight: 800 }}>Gross Pay</td>
                                        <td style={{ paddingTop: '1rem', textAlign: 'right', fontWeight: 800 }}>${result.grossPay.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={3}>Less Deductions</td>
                                        <td style={{ textAlign: 'right', color: 'red' }}>${(result.grossPay - result.netPay).toFixed(2)}</td>
                                    </tr>
                                    <tr style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>
                                        <td colSpan={3} style={{ fontWeight: 900 }}>NET PAY</td>
                                        <td style={{ textAlign: 'right', fontWeight: 900 }}>${result.netPay.toFixed(2)}</td>
                                    </tr>
                                    <tr style={{ color: '#666', fontSize: '0.9rem' }}>
                                        <td colSpan={3}>Superannuation (11.5%)</td>
                                        <td style={{ textAlign: 'right' }}>${result.superannuation.toFixed(2)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
