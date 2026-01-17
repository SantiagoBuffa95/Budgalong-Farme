
import { describe, it, expect } from 'vitest';
import { computePay, ContractInput, TimesheetEntryInput } from './engine';

describe('Payroll Engine - Pastoral Award 2020', () => {
    const baseContract: ContractInput = {
        baseRateHourly: 30.00,
        ordinaryHoursPerWeek: 38,
        classification: 'FLH3',
        overtimeMode: 'award_default'
    };

    it('Scenario 1: Standard 40h Week (Mon-Fri 8h each)', () => {
        // 5 days * 8h = 40h. Should be 38 Ord + 2 OT1.5
        const entries: TimesheetEntryInput[] = [];
        const startDate = new Date('2025-06-02'); // Monday

        for (let i = 0; i < 5; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            entries.push({
                date: date,
                startTime: new Date(date.setHours(8, 0, 0, 0)),
                endTime: new Date(date.setHours(16, 0, 0, 0)),
                breakMinutes: 0
            });
        }

        const result = computePay(entries, baseContract, []);

        // 38 Ord
        expect(result.lines.find(l => l.code === 'ORD')?.units).toBe(38);
        expect(result.lines.find(l => l.code === 'ORD')?.amount).toBe(38 * 30);

        // 2 OT1.5
        expect(result.lines.find(l => l.code === 'OT1.5')?.units).toBe(2);
        expect(result.lines.find(l => l.code === 'OT1.5')?.amount).toBe(2 * 30 * 1.5);

        // No OT2.0
        expect(result.lines.find(l => l.code === 'OT2.0')).toBeUndefined();
    });

    it('Scenario 2: Long Day (14 hours)', () => {
        // 14h total. 10 Ord -> 4 OT. First 2 OT@1.5, Next 2 OT@2.0
        const date = new Date('2025-06-02');
        const entries: TimesheetEntryInput[] = [{
            date: date,
            startTime: new Date(date.setHours(6, 0, 0, 0)),
            endTime: new Date(date.setHours(20, 0, 0, 0)),
            breakMinutes: 0
        }];

        const result = computePay(entries, baseContract, []);

        expect(result.lines.find(l => l.code === 'ORD')?.units).toBe(10);
        expect(result.lines.find(l => l.code === 'OT1.5')?.units).toBe(2);
        expect(result.lines.find(l => l.code === 'OT2.0')?.units).toBe(2);
    });

    it('Scenario 3: Sunday Work (5 hours)', () => {
        const date = new Date('2025-06-01'); // Sunday
        const entries: TimesheetEntryInput[] = [{
            date: date,
            startTime: new Date(date.setHours(8, 0, 0, 0)),
            endTime: new Date(date.setHours(13, 0, 0, 0)),
            breakMinutes: 0
        }];

        const result = computePay(entries, baseContract, []);

        // 0 Ordinary? Sunday is distinct in calc
        // Logic puts Sunday into 'sundayHours', loop continues.
        // So Ord should be 0.
        expect(result.lines.find(l => l.code === 'ORD')).toBeUndefined();

        expect(result.lines.find(l => l.code === 'SUN')?.units).toBe(5);
        expect(result.lines.find(l => l.code === 'SUN')?.amount).toBe(5 * 30 * 2.0);
    });

    it('Scenario 4: Public Holiday (8 hours)', () => {
        const date = new Date('2025-06-04'); // Wednesday
        const entries: TimesheetEntryInput[] = [{
            date: date,
            startTime: new Date(date.setHours(8, 0, 0, 0)),
            endTime: new Date(date.setHours(16, 0, 0, 0)),
            breakMinutes: 0
        }];

        const result = computePay(entries, baseContract, ['2025-06-04']); // PH Match

        expect(result.lines.find(l => l.code === 'PH')?.units).toBe(8);
        expect(result.lines.find(l => l.code === 'PH')?.amount).toBe(8 * 30 * 2.0);
    });

    it('Scenario 5: Weekly OT Escalation (50h Mon-Fri)', () => {
        // 5 days * 10h = 50h.
        // Daily: 10 Ord each. Total 50 Ord calculated in daily loop.
        // Weekly Check: 50 > 38. Excess = 12.
        // Excess 12: First 2 @ 1.5, Next 10 @ 2.0.
        // Result: 38 Ord, 2 OT1.5, 10 OT2.0.
        const entries: TimesheetEntryInput[] = [];
        const startDate = new Date('2025-06-02');

        for (let i = 0; i < 5; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            entries.push({
                date: date,
                startTime: new Date(date.setHours(8, 0, 0, 0)),
                endTime: new Date(date.setHours(18, 0, 0, 0)), // 10h
                breakMinutes: 0
            });
        }

        const result = computePay(entries, baseContract, []);

        expect(result.lines.find(l => l.code === 'ORD')?.units).toBe(38);
        expect(result.lines.find(l => l.code === 'OT1.5')?.units).toBe(2);
        expect(result.lines.find(l => l.code === 'OT2.0')?.units).toBe(10);
    });
});
