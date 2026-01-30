
import { Decimal } from "@prisma/client/runtime/library";

export interface TimesheetEntryInput {
    date: Date;
    startTime: Date;
    endTime: Date;
    breakMinutes: number;
    taskCode?: string;
}

export interface ContractInput {
    baseRateHourly: number;
    ordinaryHoursPerWeek: number;
    classification: string;
    overtimeMode: 'award_default' | 'flat_rate';
    type?: string;
    salaryAnnual?: number;
}

export interface PayLine {
    code: string;
    description: string;
    units: number; // hours usually
    rate: number;
    amount: number;
}

export interface PayResult {
    gross: number;
    tax: number;
    super: number;
    net: number;
    lines: PayLine[];
}

export const TAX_BRACKETS_2025 = [
    { limit: 18200, rate: 0 },
    { limit: 45000, rate: 0.16 }, // Stage 3 cuts (modified for 2024-25) - actually 16% up to 135k? 
    // Standard 2024-25 Residents:
    // 0 - 18,200: Nil
    // 18,201 - 45,000: 16c for each $1 over 18,200
    // 45,001 - 135,000: 30c for each $1 over 45,000
    // 135,001 - 190,000: 37c
    // > 190,000: 45c
    // BUT calculating WEEKLY withholding is complex (ATO Formulas).
    // MVP: Flat approximation or simple annualized bracket.
    // Let's use a simplified weekly formula based on brackets.
];

export function calculateWeeklyTax(gross: number): number {
    // Simplified ATO 2024-25 Weekly Withholding (approx)
    const annual = gross * 52;
    let annualTax = 0;

    if (annual <= 18200) {
        annualTax = 0;
    } else if (annual <= 45000) {
        annualTax = (annual - 18200) * 0.16;
    } else if (annual <= 135000) {
        annualTax = 4288 + (annual - 45000) * 0.30;
    } else if (annual <= 190000) {
        annualTax = 31288 + (annual - 135000) * 0.37;
    } else {
        annualTax = 51638 + (annual - 190000) * 0.45;
    }

    return parseFloat((annualTax / 52).toFixed(2));
}

export function computePay(
    entries: TimesheetEntryInput[],
    contract: ContractInput,
    publicHolidays: string[] // ISO dates YYYY-MM-DD
): PayResult {
    const lines: PayLine[] = [];
    let ordinaryHours = 0;
    let ot15Hours = 0;
    let ot20Hours = 0;
    let phHours = 0;
    let sundayHours = 0;

    // 1. Calculate Daily Hours & Classify
    for (const entry of entries) {
        const durationMs = entry.endTime.getTime() - entry.startTime.getTime();
        const durationMinutes = durationMs / (1000 * 60) - entry.breakMinutes;
        let hours = durationMinutes / 60;
        if (hours < 0) hours = 0;

        const dateStr = entry.date.toISOString().split('T')[0];
        const dayOfWeek = entry.date.getDay(); // 0 = Sunday

        // Check PH
        if (publicHolidays.includes(dateStr)) {
            phHours += hours;
            continue;
        }

        // Check Sunday
        if (dayOfWeek === 0) {
            sundayHours += hours; // Award: Sunday is usually double time for Farm Hands
            continue;
        }

        // Ordinary vs OT (Daily > 10)
        if (hours > 10) {
            const ot = hours - 10;
            const ord = 10;

            ordinaryHours += ord;
            // Daily OT is usually T1.5 first 2 hours, then T2.0
            if (ot > 2) {
                ot15Hours += 2;
                ot20Hours += (ot - 2);
            } else {
                ot15Hours += ot;
            }
        } else {
            ordinaryHours += hours;
        }
    }

    // 2. Weekly OT Check (simplified > 38)
    // This interacts with daily OT. Usually you pick the method that benefits employee or specific order.
    // MVP Rule: Total Ordinary > 38 -> convert excess to OT1.5
    if (ordinaryHours > 38) {
        const excess = ordinaryHours - 38;
        ordinaryHours = 38;

        // Weekly OT Escalation (Common interpretation: starts at 1.5x)
        // Note: Some awards reset the "first 2 hours" counter daily. 
        // If the excess comes from "Ord hours > 38", it's distinct from Daily OT.
        // We'll apply the standard 2 hrs @ 1.5 then 2.0 rule to this block too.
        if (excess > 2) {
            ot15Hours += 2;
            ot20Hours += (excess - 2);
        } else {
            ot15Hours += excess;
        }
    }

    // 3. Generate Lines
    const baseRate = contract.baseRateHourly;

    // Check for Salary Mode
    // If it's explicitly 'salary', OR if it is 'full_time' with 0 hourly rate but has an annual salary provided (inference)
    const isSalary = (contract.type === 'salary') || (contract.salaryAnnual && contract.salaryAnnual > 0 && (!baseRate || baseRate === 0));

    if (isSalary && contract.salaryAnnual && contract.salaryAnnual > 0) {
        // Salary Logic: Fixed Weekly Amount
        const weeklyAmount = contract.salaryAnnual / 52;
        const derivedRate = weeklyAmount / (contract.ordinaryHoursPerWeek || 38);

        lines.push({
            code: 'SALARY',
            description: 'Weekly Salary',
            units: 38, // Standard week unit
            rate: parseFloat(derivedRate.toFixed(4)),
            amount: parseFloat(weeklyAmount.toFixed(2))
        });

        // Add OT if flagged? For now, ignore pure ordinary hours calculation
        // But still add OT if explicitly outside "Ordinary"? 
        // Usually salaried don't get OT unless specific overrides. 
        // We will SKIP the automatic "Ordinary Hours" line below.
    } else {
        // Hourly Logic
        if (ordinaryHours > 0) {
            lines.push({ code: 'ORD', description: 'Ordinary Hours', units: ordinaryHours, rate: baseRate, amount: ordinaryHours * baseRate });
        }
    }

    if (ot15Hours > 0) {
        lines.push({ code: 'OT1.5', description: 'Overtime x1.5', units: ot15Hours, rate: baseRate * 1.5, amount: ot15Hours * baseRate * 1.5 });
    }
    if (ot20Hours > 0) {
        lines.push({ code: 'OT2.0', description: 'Overtime x2.0', units: ot20Hours, rate: baseRate * 2.0, amount: ot20Hours * baseRate * 2.0 });
    }
    if (sundayHours > 0) {
        lines.push({ code: 'SUN', description: 'Sunday Hours', units: sundayHours, rate: baseRate * 2.0, amount: sundayHours * baseRate * 2.0 });
    }
    if (phHours > 0) {
        lines.push({ code: 'PH', description: 'Public Holiday', units: phHours, rate: baseRate * 2.0, amount: phHours * baseRate * 2.0 }); // Award: 200%
    }

    // 4. Totals
    const gross = lines.reduce((sum, l) => sum + l.amount, 0);
    const tax = calculateWeeklyTax(gross);
    // Super calculation remains the same (11.5% of OTE). Salary is OTE.
    const superAmount = gross * 0.115;

    return {
        gross: parseFloat(gross.toFixed(2)),
        tax,
        super: parseFloat(superAmount.toFixed(2)),
        net: parseFloat((gross - tax).toFixed(2)),
        lines
    };
}
