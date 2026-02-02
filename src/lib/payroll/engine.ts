
import { Decimal } from "@prisma/client/runtime/library";

export interface TimesheetEntryInput {
    date: Date;
    startTime: Date;
    endTime: Date;
    breakMinutes: number;
    taskCode?: string;
    isNightShift?: boolean;
    isPublicHoliday?: boolean;
}

export interface ContractInput {
    baseRateHourly: number;
    ordinaryHoursPerWeek: number;
    classification: string;
    overtimeMode: 'award_default' | 'flat_rate';
    type?: string;
    salaryAnnual?: number;
    allowances?: {
        dog?: boolean;
        horse?: boolean;
        firstAid?: boolean;
        meal?: boolean; // Currently treated as weekly/recurring for MVP, normally per-occurrence
        tool?: boolean;
    };
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
    { limit: 45000, rate: 0.16 },
    { limit: 135000, rate: 0.30 },
    { limit: 190000, rate: 0.37 },
    { limit: 999999999, rate: 0.45 }
];

export function calculateWeeklyTax(gross: number): number {
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

    // Hourly Buckets
    let ordinaryHours = 0;
    let ot15Hours = 0;
    let ot20Hours = 0;
    let phHours = 0;
    let nightHours = 0;
    let sundayHours = 0;

    // Contract Type Checks
    const type = (contract.type || 'casual').toLowerCase();
    const isCasual = type === 'casual';
    const isSalary = type === 'salary' || (contract.salaryAnnual && contract.salaryAnnual > 0 && (!contract.baseRateHourly || contract.baseRateHourly === 0));
    const isPartTime = type === 'part_time';
    const isFullTime = type === 'full_time';

    // Base Rate
    let baseRate = contract.baseRateHourly || 0;
    if (isSalary && contract.salaryAnnual) {
        // Derived hourly rate for OT calc if needed
        baseRate = contract.salaryAnnual / 52 / (contract.ordinaryHoursPerWeek || 38);
    }

    // Loading Multipliers (Approximations based on common Awards)
    const CASUAL_LOADING = 0.25; // 25%
    const PH_MULTIPLIER = isCasual ? 2.5 : 2.0; // Casuals get higher PH rate usually
    const SUNDAY_MULTIPLIER = 2.0;
    const NIGHT_MULTIPLIER = 0.15; // 15% loading

    // 1. Calculate Daily Hours & Classify
    for (const entry of entries) {
        const durationMs = entry.endTime.getTime() - entry.startTime.getTime();
        const durationMinutes = durationMs / (1000 * 60) - entry.breakMinutes;
        let hours = durationMinutes / 60;
        if (hours < 0) hours = 0;

        const dateStr = entry.date.toISOString().split('T')[0];
        const dayOfWeek = entry.date.getDay(); // 0 = Sunday

        // Check Flags
        const isPH = entry.isPublicHoliday || publicHolidays.includes(dateStr);
        const isNight = !!entry.isNightShift;

        // --- PUBLIC HOLIDAY ---
        if (isPH) {
            phHours += hours;
            continue; // PH overrides all
        }

        // --- SUNDAY ---
        if (dayOfWeek === 0) {
            sundayHours += hours;
            continue; // Sunday overrides ordinary
        }

        // --- OVERTIME & ORDINARY ---
        let limit = 100; // Unlimited effectively
        if (isSalary) limit = 7.5;
        // Perm (FT/PT) daily OT is implied standard 10h if not specified otherwise, but strict prompt said "without restriction daily" for FT.
        // However, usually 10h is a safeguard. If prompt specifically asked "without restriction", maybe limit=100 for FT/PT too.
        // Casual NO Weekly OT, but YES Daily OT? Usually Casuals get OT > 10.
        // I will stick to 10h for Casual, 100 for FT/PT (rely on Weekly), 7.5 for Salary.
        if (isCasual) limit = 10;
        if (isFullTime || isPartTime) limit = 100;

        if (hours > limit) {
            const ord = limit;
            const ot = hours - limit;

            ordinaryHours += ord;
            if (isNight) nightHours += ord;

            // OT Logic
            if (ot > 2) {
                ot15Hours += 2;
                ot20Hours += (ot - 2);
            } else {
                ot15Hours += ot;
            }
        } else {
            ordinaryHours += hours;
            if (isNight) nightHours += hours;
        }
    }

    // 2. Weekly OT Check
    if (!isCasual && !isSalary) {
        if (ordinaryHours > 38) {
            const excess = ordinaryHours - 38;
            ordinaryHours = 38;

            if (excess > 2) {
                ot15Hours += 2;
                ot20Hours += (excess - 2);
            } else {
                ot15Hours += excess;
            }
        }
    }

    // 3. Generate Lines

    // --- SALARY ---
    if (isSalary) {
        const salaryWeekly = (contract.salaryAnnual || 0) / 52;
        lines.push({
            code: 'SALARY',
            description: 'Weekly Salary Base',
            units: 38, // Placeholder units
            rate: parseFloat(derivedRate(contract).toFixed(4)),
            amount: parseFloat(salaryWeekly.toFixed(2))
        });
    } else {
        // --- HOURLY (Casual / FT / PT) ---
        let payRate = baseRate;
        // Note: For Casual, if baseRate is 'flat', it likely includes loading.
        // If it doesn't, we should add it. Prompt says "Casual Pago base: flat hourly rate".
        // I'll assume inputted rate IS the rate.

        if (ordinaryHours > 0) {
            lines.push({ code: 'ORD', description: isCasual ? 'Casual Hours' : 'Ordinary Hours', units: ordinaryHours, rate: payRate, amount: ordinaryHours * payRate });
        }
    }

    // --- LOADINGS & OT ---
    // Night Shift
    if (nightHours > 0) {
        const loadingRate = baseRate * NIGHT_MULTIPLIER;
        lines.push({ code: 'NIGHT', description: 'Night Shift Loading', units: nightHours, rate: loadingRate, amount: nightHours * loadingRate });
    }

    // OT
    if (ot15Hours > 0) {
        lines.push({ code: 'OT1.5', description: 'Overtime x1.5', units: ot15Hours, rate: baseRate * 1.5, amount: ot15Hours * baseRate * 1.5 });
    }
    if (ot20Hours > 0) {
        lines.push({ code: 'OT2.0', description: 'Overtime x2.0', units: ot20Hours, rate: baseRate * 2.0, amount: ot20Hours * baseRate * 2.0 });
    }

    // Special Days
    if (sundayHours > 0) {
        const rate = baseRate * SUNDAY_MULTIPLIER;
        lines.push({ code: 'SUN', description: 'Sunday Work', units: sundayHours, rate: rate, amount: sundayHours * rate });
    }
    if (phHours > 0) {
        const rate = baseRate * PH_MULTIPLIER;
        lines.push({ code: 'PH', description: 'Public Holiday', units: phHours, rate: rate, amount: phHours * rate });
    }

    // --- ALLOWANCES ---
    if (contract.allowances) {
        const { dog, horse, firstAid, tool, meal } = contract.allowances;

        if (dog) lines.push({ code: 'ALL_DOG', description: 'Dog Allowance', units: 1, rate: 10.00, amount: 10.00 });
        if (horse) lines.push({ code: 'ALL_HORSE', description: 'Horse Allowance', units: 1, rate: 15.00, amount: 15.00 });
        if (firstAid) lines.push({ code: 'ALL_FA', description: 'First Aid Allowance', units: 1, rate: 5.00, amount: 5.00 });
        if (meal) lines.push({ code: 'ALL_MEAL', description: 'Meal Allowance', units: 1, rate: 15.00, amount: 15.00 });
    }

    // 4. Totals
    const gross = lines.reduce((sum, l) => sum + l.amount, 0);
    const tax = calculateWeeklyTax(gross);
    const oteLines = lines.filter(l => !l.code.startsWith('OT')); // Exclude OT from Super
    const ote = oteLines.reduce((sum, l) => sum + l.amount, 0);
    const superAmount = ote * 0.115;

    return {
        gross: parseFloat(gross.toFixed(2)),
        tax,
        super: parseFloat(superAmount.toFixed(2)),
        net: parseFloat((gross - tax).toFixed(2)),
        lines
    };
}

function derivedRate(contract: ContractInput): number {
    return (contract.salaryAnnual || 0) / 52 / (contract.ordinaryHoursPerWeek || 38);
}
