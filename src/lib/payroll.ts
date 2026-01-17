import { Contract, TimesheetEntry, PaySlip, PaySlipItem } from './types';

export function calculateWeeklyPay(contract: Contract, timesheets: TimesheetEntry[]): PaySlip {
    let grossPay = 0;
    const items: PaySlipItem[] = [];

    timesheets.forEach(entry => {
        // 1. Calculate Hours Worked (Native JS Date)
        // Assume date is "YYYY-MM-DD" and time is "HH:mm"
        const start = new Date(`${entry.date}T${entry.startTime}:00`);
        const end = new Date(`${entry.date}T${entry.endTime}:00`);

        let diffMs = end.getTime() - start.getTime();
        if (diffMs < 0) {
            // Handle overnight (ends next day)
            // Add 24 hours in milliseconds
            diffMs += 24 * 60 * 60 * 1000;
        }

        const diffMinutes = diffMs / (1000 * 60);
        const workHours = (diffMinutes - entry.breakMinutes) / 60;

        if (workHours <= 0) return;

        // 2. Determine Rate Multiplier
        const dayOfWeek = new Date(entry.date).getDay(); // 0 = Sunday, 6 = Saturday

        let dailyPay = 0;

        // Contractor Logic
        if (contract.type === 'contractor') {
            dailyPay = workHours * contract.baseRate;
            items.push({
                description: `Contractor Services (${entry.date})`,
                units: workHours,
                rate: contract.baseRate,
                total: Math.round(dailyPay * 100) / 100
            });
            grossPay += dailyPay;
            return;
        }

        // Employee Logic
        let ordHours = 0;
        let ot15Hours = 0;
        let ot20Hours = 0;
        let ot25Hours = 0;

        if (entry.isPublicHoliday) {
            ot25Hours = workHours; // 2.5x
        } else if (dayOfWeek === 0) {
            // Sunday: 2.0x
            ot20Hours = workHours;
        } else if (dayOfWeek === 6) {
            // Saturday: First 2h @ 1.5x, rest @ 2.0x (Common Award Interpretation for casual/OT)
            if (workHours > 2) {
                ot15Hours = 2;
                ot20Hours = workHours - 2;
            } else {
                ot15Hours = workHours;
            }
        } else {
            // Weekday (Mon-Fri)
            const dailyCap = 8;

            if (workHours > dailyCap) {
                ordHours = dailyCap;
                const overtime = workHours - dailyCap;
                if (overtime > 2) {
                    ot15Hours = 2;
                    ot20Hours = overtime - 2;
                } else {
                    ot15Hours = overtime;
                }
            } else {
                ordHours = workHours;
            }
        }

        // Apply Rates
        const round = (n: number) => Math.round(n * 100) / 100;

        if (ordHours > 0) {
            const rate = contract.baseRate * (entry.isNightShift ? 1.15 : 1.0);
            const total = round(ordHours * rate);
            items.push({
                description: `Ordinary Hours ${entry.isNightShift ? '(Night)' : ''} - ${entry.date}`,
                units: ordHours,
                rate: rate,
                total: total
            });
            grossPay += total;
        }

        if (ot15Hours > 0) {
            const rate = contract.baseRate * 1.5;
            const total = round(ot15Hours * rate);
            items.push({ description: `Overtime (1.5x) - ${entry.date}`, units: ot15Hours, rate, total });
            grossPay += total;
        }

        if (ot20Hours > 0) {
            const rate = contract.baseRate * 2.0;
            const total = round(ot20Hours * rate);
            items.push({ description: `Overtime (2.0x) - ${entry.date}`, units: ot20Hours, rate, total });
            grossPay += total;
        }

        if (ot25Hours > 0) {
            const rate = contract.baseRate * 2.5;
            const total = round(ot25Hours * rate);
            items.push({ description: `Public Holiday (2.5x) - ${entry.date}`, units: ot25Hours, rate, total });
            grossPay += total;
        }
    });

    // 3. Weekly Allowances & Deductions
    if (contract.allowances.dog) {
        const amt = 25.00;
        items.push({ description: "Dog Allowance", units: 1, rate: amt, total: amt });
        grossPay += amt;
    }
    if (contract.allowances.firstAid) {
        const amt = 20.00;
        items.push({ description: "First Aid Allowance", units: 1, rate: amt, total: amt });
        grossPay += amt;
    }

    let totalDeductions = 0;
    if (contract.deductions.accommodation > 0) {
        const amt = contract.deductions.accommodation;
        items.push({ description: "Accommodation Deduction", units: 1, rate: -amt, total: -amt });
        totalDeductions += amt;
    }

    // 4. Totals
    const superRate = 0.115;
    const superAmount = contract.type === 'employee' && contract.superannuation ? (grossPay * superRate) : 0;

    const netPay = grossPay - totalDeductions;

    return {
        weekEnding: timesheets[timesheets.length - 1]?.date || new Date().toISOString().split('T')[0],
        grossPay: Math.round(grossPay * 100) / 100,
        tax: 0,
        netPay: Math.round(netPay * 100) / 100,
        superannuation: Math.round(superAmount * 100) / 100,
        items
    };
}
