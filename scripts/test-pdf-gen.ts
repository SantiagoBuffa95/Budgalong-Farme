import { generatePayslipPdf, PayslipData } from '../src/lib/pdf-service';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock Data for Salary Employee
const salaryData: PayslipData = {
    id: "TEST-001",
    farmName: "Test Farm Pty Ltd",
    farmAbn: "12 345 678 901",
    employeeName: "Salary Sam",
    employeeAddress: "123 Farm Lane, Rural NSW 2000",
    payRunStart: "2026-01-20",
    payRunEnd: "2026-01-26",
    payDate: "2026-01-27",
    gross: 1153.85,  // $60k / 52
    tax: 200.00,
    super: 132.69,
    net: 821.16,
    lines: [
        {
            code: 'SALARY',
            description: 'Weekly Salary',
            units: 38,
            rate: 30.36,
            amount: 1153.85
        }
    ],
    baseRate: 0,
    totalHours: 38
};

// Mock Data for Hourly Employee
const hourlyData: PayslipData = {
    id: "TEST-002",
    farmName: "Test Farm Pty Ltd",
    farmAbn: "12 345 678 901",
    employeeName: "Hourly Harry",
    employeeAddress: "456 Grazing Rd, Outback QLD 4000",
    payRunStart: "2026-01-20",
    payRunEnd: "2026-01-26",
    payDate: "2026-01-27",
    gross: 1000.00,
    tax: 150.00,
    super: 115.00,
    net: 735.00,
    lines: [
        { code: 'ORD', description: 'Ordinary Hours', units: 38, rate: 25.00, amount: 950.00 },
        { code: 'OT1.5', description: 'Overtime x1.5', units: 1, rate: 37.50, amount: 37.50 },
        { code: 'OT2.0', description: 'Overtime x2.0', units: 0.25, rate: 50.00, amount: 12.50 }
    ],
    baseRate: 25.00,
    totalHours: 39.25
};

async function generate() {
    try {
        console.log("Generating Salary PDF...");
        const buf1 = await generatePayslipPdf(salaryData);
        fs.writeFileSync(path.join(__dirname, 'salary_payslip.pdf'), Buffer.from(buf1));
        console.log("Saved salary_payslip.pdf");

        console.log("Generating Hourly PDF...");
        const buf2 = await generatePayslipPdf(hourlyData);
        fs.writeFileSync(path.join(__dirname, 'hourly_payslip.pdf'), Buffer.from(buf2));
        console.log("Saved hourly_payslip.pdf");

    } catch (e) {
        console.error(e);
    }
}

generate();
