"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import styles from "./reports.module.css";
import { getTimesheets, getContracts } from "@/lib/actions";
import { calculateWeeklyPay } from "@/lib/payroll";
import { WeeklyTimesheet, Contract } from "@/lib/types";

ChartJS.register(ArcElement, Tooltip, Legend);

export const dynamic = 'force-dynamic';

export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{ timesheets: WeeklyTimesheet[], contracts: Contract[] }>({ timesheets: [], contracts: [] });

    // Filters
    const [periodType, setPeriodType] = useState<'week' | 'month' | 'year'>('month');
    const [selectedPeriod, setSelectedPeriod] = useState<string>(new Date().toISOString().slice(0, 7)); // Default to current YYYY-MM

    useEffect(() => {
        async function load() {
            const [ts, cs] = await Promise.all([getTimesheets(), getContracts()]);
            setData({ timesheets: ts, contracts: cs });
            setLoading(false);
        }
        load();
    }, []);

    if (loading) return <div className="container flex-center">Loading Data...</div>;

    // --- Logic to Filter and Calculate Costs ---

    // 1. Filter Timesheets by Period
    const filteredSheets = data.timesheets.filter(ts => {
        // ts.weekEnding is YYYY-MM-DD
        if (periodType === 'week') {
            if (!selectedPeriod) return false;
            // Helper: Check if dates are in same ISO week
            const d1 = new Date(selectedPeriod);
            const d2 = new Date(ts.weekEnding);

            // Adjust to Monday start to compare weeks
            const getWeekBase = (d: Date) => {
                const date = new Date(d.getTime());
                const day = date.getDay();
                const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
                return new Date(date.setDate(diff)).setHours(0, 0, 0, 0);
            };

            // Simple comparison: absolute difference < 7 days? 
            // Better: Compare if they fall in same Monday-Sunday block
            // Or easiest for now: Just match exact string first to debug, 
            // BUT given user report, let's allow a 3-day buffer margin to catch "Weekend" discrepancies

            // Let's stick to "Same Week" logic:
            const w1 = getWeekBase(d1);
            const w2 = getWeekBase(d2);
            return w1 === w2;

        } else if (periodType === 'month') {
            return ts.weekEnding.startsWith(selectedPeriod); // YYYY-MM match
        } else {
            return ts.weekEnding.startsWith(selectedPeriod); // YYYY match
        }
    });

    // 2. Aggregate Costs by Employee Type (Contractor vs Employee)
    let totalCost = 0;
    let employeeCost = 0;
    let contractorCost = 0;

    filteredSheets.forEach(ts => {
        // Find ACTIVE contract for this employee
        const contract = data.contracts.find(c => c.employeeId === ts.employeeId && c.status.toLowerCase() === 'active');
        if (!contract) return;

        // Use approved AND paid timesheets
        if (ts.status !== 'Approved' && ts.status !== 'Paid') return;

        // Use persisted financials if available
        let grossPay = 0;
        let superAmount = 0;

        if (ts.financials && ts.financials.gross > 0) {
            grossPay = ts.financials.gross;
            superAmount = ts.financials.super;
        } else {
            // Re-calculate pay for legacy timesheets
            const pay = calculateWeeklyPay(contract, ts.entries);
            grossPay = pay.grossPay;
            superAmount = pay.superannuation;
        }

        // Sum it up
        totalCost += grossPay;
        const trueCost = grossPay + superAmount;

        if (contract.type === 'contractor') {
            contractorCost += trueCost;
        } else {
            employeeCost += trueCost;
        }
    });

    const chartData = {
        labels: ['Employees (Wages + Super)', 'Contractors (Invoices)'],
        datasets: [
            {
                label: 'Cost ($AUD)',
                data: [employeeCost, contractorCost],
                backgroundColor: [
                    '#4CAF50', // Primary Green
                    '#FFC107', // Secondary Yellow
                ],
                borderColor: [
                    '#388E3C',
                    '#FFA000',
                ],
                borderWidth: 2,
            },
        ],
    };

    // --- Handlers for Inputs ---
    const handlePeriodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedPeriod(e.target.value);
    };

    return (
        <div className="container">
            <header className={styles.header}>
                <Link href="/admin" className="btn btn-secondary">← Back to Admin</Link>
                <h1>Financial Reports</h1>
                <p>Analyze your farm's labor costs.</p>
            </header>

            {/* 1. Controller Bar */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>

                    <div className={styles.toggleGroup}>
                        <button
                            className={`${styles.toggleBtn} ${periodType === 'week' ? styles.active : ''}`}
                            onClick={() => { setPeriodType('week'); setSelectedPeriod(''); }} // Reset date on switch
                        >
                            Weekly
                        </button>
                        <button
                            className={`${styles.toggleBtn} ${periodType === 'month' ? styles.active : ''}`}
                            onClick={() => { setPeriodType('month'); setSelectedPeriod(new Date().toISOString().slice(0, 7)); }}
                        >
                            Monthly
                        </button>
                        <button
                            className={`${styles.toggleBtn} ${periodType === 'year' ? styles.active : ''}`}
                            onClick={() => { setPeriodType('year'); setSelectedPeriod(new Date().getFullYear().toString()); }}
                        >
                            Yearly
                        </button>
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Select Period:</label>
                        {periodType === 'week' && <input type="date" value={selectedPeriod} onChange={handlePeriodChange} />}
                        {periodType === 'month' && <input type="month" value={selectedPeriod} onChange={handlePeriodChange} />}
                        {periodType === 'year' && <input type="number" min="2020" max="2030" value={selectedPeriod} onChange={handlePeriodChange} placeholder="YYYY" />}
                    </div>

                </div>
            </div>

            {/* 2. Visuals */}
            <div className="grid-auto">
                {/* BIG CHART */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h3>Cost Distribution</h3>
                    {totalCost === 0 ? (
                        <div style={{ padding: '3rem', color: '#999' }}>No data found for this period.</div>
                    ) : (
                        <div style={{ width: '300px', height: '300px' }}>
                            <Doughnut data={chartData} />
                        </div>
                    )}
                </div>

                {/* SUMMARY NUMBERS */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3>Summary ({periodType.toUpperCase()})</h3>

                    <div className={styles.statRow}>
                        <span>Total Labor Cost:</span>
                        <span className={styles.bigNumber}>${totalCost.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <hr style={{ margin: '1rem 0', borderColor: '#eee' }} />

                    <div className={styles.statDetail}>
                        <span style={{ color: '#2E7D32' }}>👨‍🌾 Employees:</span>
                        <strong>${employeeCost.toLocaleString()}</strong>
                    </div>
                    <div className={styles.statDetail}>
                        <span style={{ color: '#FF8F00' }}>🚜 Contractors:</span>
                        <strong>${contractorCost.toLocaleString()}</strong>
                    </div>

                    <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#666' }}>
                        * Includes Wages, Superannuation & Allowances. <br />
                        * Only counts "Approved" timesheets.
                    </div>
                </div>
            </div>

        </div>
    );
}
