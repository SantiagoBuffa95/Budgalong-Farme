
import { computePay, TimesheetEntryInput, ContractInput, PayResult } from "@/lib/payroll/engine";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Manual validation to avoid importing large Zod schemas if not needed, 
        // but robust enough to prevent crashes.
        if (!body.entries || !Array.isArray(body.entries) || !body.contract) {
            return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
        }

        // Transform Dates (JSON dates are strings)
        const entries: TimesheetEntryInput[] = body.entries.map((e: any) => ({
            ...e,
            date: new Date(e.date),
            startTime: new Date(e.startTime),
            endTime: new Date(e.endTime),
            breakMinutes: Number(e.breakMinutes) || 0,
            isNightShift: Boolean(e.isNightShift),
            isPublicHoliday: Boolean(e.isPublicHoliday)
        }));

        const contract: ContractInput = {
            ...body.contract,
            baseRateHourly: Number(body.contract.baseRateHourly) || 0,
            ordinaryHoursPerWeek: Number(body.contract.ordinaryHoursPerWeek) || 38,
            salaryAnnual: Number(body.contract.salaryAnnual) || 0
        };

        // Calculate (Stateless, CPU bound)
        const result: PayResult = computePay(entries, contract, []); // Empty public holidays array for demo (user sets flag manually)

        return NextResponse.json(result);

    } catch (error) {
        console.error("Demo Calc Error:", error);
        return NextResponse.json({ error: "Calculation failed" }, { status: 500 });
    }
}
