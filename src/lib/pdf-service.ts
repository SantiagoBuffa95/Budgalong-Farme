
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PayLine } from './payroll/engine';

export interface PayslipData {
    id: string;
    employeeName: string;
    payRunStart: string;
    payRunEnd: string;
    payDate: string;
    gross: number;
    tax: number;
    super: number;
    net: number;
    lines: PayLine[];
}

export async function generatePayslipPdf(data: PayslipData): Promise<ArrayBuffer> {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text('PAYSLIP', 14, 20);

    doc.setFontSize(10);
    doc.text(`Employee: ${data.employeeName}`, 14, 30);
    doc.text(`Pay Period: ${data.payRunStart} to ${data.payRunEnd}`, 14, 36);
    doc.text(`Pay Date: ${data.payDate}`, 14, 42);
    doc.text(`Slip ID: ${data.id.slice(0, 8)}`, 14, 48);

    // Earnings Table
    const tableData = data.lines.map(l => [
        l.description,
        l.units.toFixed(2),
        `$${l.rate.toFixed(2)}`,
        `$${l.amount.toFixed(2)}`
    ]);

    autoTable(doc, {
        startY: 55,
        head: [['Description', 'Units', 'Rate', 'Amount']],
        body: tableData,
    });

    // Totals
    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY + 10;

    doc.text(`Gross Pay: $${data.gross.toFixed(2)}`, 14, finalY);
    doc.text(`Tax Withheld: $${data.tax.toFixed(2)}`, 14, finalY + 6);
    doc.text(`Superannuation (Included/Fund): $${data.super.toFixed(2)}`, 14, finalY + 12);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`NET PAY: $${data.net.toFixed(2)}`, 14, finalY + 22);

    return doc.output('arraybuffer');
}
