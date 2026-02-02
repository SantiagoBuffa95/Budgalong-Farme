
import { describe, it, expect } from 'vitest';
import { computePay, ContractInput, TimesheetEntryInput } from './engine';

describe('Payroll Engine - Advanced Rules', () => {

    // Helper to create Dates
    const makeEntry = (dayOffset: number, hours: number, isNight = false, isPH = false): TimesheetEntryInput => {
        const d = new Date('2025-06-02'); // Monday
        d.setDate(d.getDate() + dayOffset);

        const start = new Date(d);
        start.setHours(8, 0, 0, 0); // 8 AM

        const end = new Date(d);
        end.setHours(8 + hours, 0, 0, 0);

        return {
            date: d,
            startTime: start,
            endTime: end,
            breakMinutes: 0,
            isNightShift: isNight,
            isPublicHoliday: isPH
        };
    };

    it('Scenario A: Casual 45h (Mon-Fri 9h) with Night Shift - NO Weekly OT', () => {
        // Casual: Flat Rate + Night Loading. NO OT > 38.
        // 5 days * 9h = 45h.
        // Should be: 45 Ordinary Hours. NO OT.
        // BUT Night Shift on one day? "Casual 45h with night shift"
        // Let's make Day 1 Night Shift (9h).
        // Result: 45 Ord Hours. 9 Night Hours (Loading). 
        // Note: Engine logic: Night hours are counted in "Ord" bucket AND "Night" bucket (for loading).

        const entries: TimesheetEntryInput[] = [];
        for (let i = 0; i < 5; i++) {
            entries.push(makeEntry(i, 9, i === 0)); // Day 0 is Night
        }

        const contract: ContractInput = {
            baseRateHourly: 30,
            ordinaryHoursPerWeek: 38,
            classification: 'Casual L1',
            overtimeMode: 'flat_rate',
            type: 'casual'
        };

        const result = computePay(entries, contract, []);

        // 1. Check Ordinary: Should be 45 (All hours paid at base rate)
        // Wait, did I implement "No Weekly OT"? Yes, if (!isCasual && !isSalary) keys the OT block.
        // So Casual skips the >38 check.
        const ordLine = result.lines.find(l => l.code === 'ORD');
        expect(ordLine?.units).toBe(45);
        expect(ordLine?.amount).toBe(45 * 30);

        // 2. Check Night Loading
        // Day 0 was 9 hours Night.
        const nightLine = result.lines.find(l => l.code === 'NIGHT');
        expect(nightLine?.units).toBe(9);
        expect(nightLine?.rate).toBe(30 * 0.15); // 15% loading
        expect(nightLine?.amount).toBe(9 * (30 * 0.15));

        // 3. Ensure NO OT
        expect(result.lines.find(l => l.code.startsWith('OT'))).toBeUndefined();
    });

    it('Scenario B: Full-Time 50h (Mon-Fri 10h) with Public Holiday', () => {
        // FT: Weekly OT triggers > 38.
        // One day is PH (8h worked on PH? Or just PH taken? Usually "Public Holiday" implies worked or taken. 
        // Timesheet usually records WORKED hours.
        // If they worked 10h on PH: That is PH Work (Penalty), usually DOES NOT count towards Ord hours for OT calculation?
        // Or does it?
        // Engine logic: 
        // if (isPH) { phHours += hours; continue; }
        // So PH hours are REMOVED from the Weekly OT Count.
        // Let's say Day 2 is PH (10h).
        // Days 0,1,3,4 = 4 * 10h = 40 Ordinary Worked.
        // Day 2 = 10 PH Hours.
        // Weekly Ord = 40. Excess > 38 = 2.
        // Result: 38 Ord, 2 OT1.5. PLUS 10 PH Hours (at 200% or 250%).

        const entries: TimesheetEntryInput[] = [];
        for (let i = 0; i < 5; i++) {
            entries.push(makeEntry(i, 10, false, i === 2)); // Day 2 is PH
        }

        const contract: ContractInput = {
            baseRateHourly: 40,
            ordinaryHoursPerWeek: 38,
            classification: 'FT L2',
            overtimeMode: 'award_default',
            type: 'full_time'
        };

        const result = computePay(entries, contract, []);

        // PH Line
        const phLine = result.lines.find(l => l.code === 'PH');
        expect(phLine?.units).toBe(10);
        expect(phLine?.rate).toBe(40 * 2.0); // 200% for FT

        // Ordinary + OT
        // Remaining Normal Hours = 40.
        // > 38 = 2.
        const ordLine = result.lines.find(l => l.code === 'ORD');
        expect(ordLine?.units).toBe(38);

        const otLine = result.lines.find(l => l.code === 'OT1.5');
        expect(otLine?.units).toBe(2);
    });

    it('Scenario C: Part-Time 40h (Mon-Fri 8h) - OT applies', () => {
        // PT: Threshold 38.
        // 40h worked -> 38 Ord, 2 OT1.5.
        const entries: TimesheetEntryInput[] = [];
        for (let i = 0; i < 5; i++) {
            entries.push(makeEntry(i, 8));
        }

        const contract: ContractInput = {
            baseRateHourly: 35,
            ordinaryHoursPerWeek: 38,
            classification: 'PT L1',
            overtimeMode: 'award_default',
            type: 'part_time'
        };

        const result = computePay(entries, contract, []);

        expect(result.lines.find(l => l.code === 'ORD')?.units).toBe(38);
        expect(result.lines.find(l => l.code === 'OT1.5')?.units).toBe(2);
    });

    it('Scenario D: Salary (Annual 78k) - 9h Day (Daily OT)', () => {
        // Salary: Base paid weekly = 78000 / 52 = 1500.
        // Derived Hourly = 1500 / 38 = 39.4737...
        // One day worked 9h.
        // Limit is 7.5h. Excess = 1.5h.
        // OT rule: 1.5h OT. 
        // Base Salary Line should exist regardless of hours.
        // OT line should exist for 1.5h.

        const entries: TimesheetEntryInput[] = [makeEntry(0, 9)]; // 9 hours

        const contract: ContractInput = {
            baseRateHourly: 0,
            salaryAnnual: 78000,
            ordinaryHoursPerWeek: 38,
            classification: 'Manager',
            overtimeMode: 'award_default',
            type: 'salary'
        };

        const result = computePay(entries, contract, []);

        // Salary Line
        const salLine = result.lines.find(l => l.code === 'SALARY');
        expect(salLine).toBeDefined();
        expect(salLine?.amount).toBeCloseTo(1500, 1);

        // OT Line (1.5h)
        // Rate? Usually derived from annual or specific base. Engine uses derived baseRate.
        // 9h - 7.5h = 1.5h OT.
        const otLine = result.lines.find(l => l.code === 'OT1.5');
        expect(otLine?.units).toBe(1.5);

        const derivedRate = 78000 / 52 / 38;
        expect(otLine?.rate).toBeCloseTo(derivedRate * 1.5, 2);
    });

    it('Scenario E: Allowances (Dog + First Aid)', () => {
        const entries: TimesheetEntryInput[] = [makeEntry(0, 8)];

        const contract: ContractInput = {
            baseRateHourly: 30,
            ordinaryHoursPerWeek: 38,
            classification: 'L1',
            overtimeMode: 'award_default',
            type: 'full_time',
            allowances: {
                dog: true,
                firstAid: true
            }
        };

        const result = computePay(entries, contract, []);

        expect(result.lines.find(l => l.code === 'ALL_DOG')).toBeDefined();
        expect(result.lines.find(l => l.code === 'ALL_FA')).toBeDefined();
        expect(result.lines.find(l => l.code === 'ALL_HORSE')).toBeUndefined();

        // Check totals
        // Ord: 8 * 30 = 240
        // Dog: 10
        // FA: 5
        // Total: 255
        expect(result.gross).toBe(255);
    });

});
