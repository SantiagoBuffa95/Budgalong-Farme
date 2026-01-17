import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Contract, PaySlip } from './types';

export function generatePaySlipPDF(contract: Contract, slip: PaySlip) {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text('BUDGALONG FARM - PAYSLIP', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.text('ABN: 12 345 678 910 | Australian Rural Management', 105, 27, { align: 'center' });

    // Employee details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('EMPLOYEE DETAILS', 20, 40);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${contract.firstName} ${contract.lastName}`, 20, 47);
    doc.text(`Classification: ${contract.classification}`, 20, 52);
    doc.text(`Employment: ${contract.type.toUpperCase()}`, 20, 57);

    // Pay period details
    doc.setFont('helvetica', 'bold');
    doc.text('PAY PERIOD INFO', 140, 40);
    doc.setFont('helvetica', 'normal');
    doc.text(`Week Ending: ${slip.weekEnding}`, 140, 47);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 140, 52);

    // Line Items Table
    const tableRows = slip.items.map(item => [
        item.description,
        item.units.toFixed(2),
        `$${item.rate.toFixed(2)}`,
        `$${item.total.toFixed(2)}`
    ]);

    autoTable(doc, {
        startY: 65,
        head: [['Description', 'Units', 'Rate', 'Total']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [46, 125, 50] }, // Rosi Green
    });

    // Totals
    // @ts-ignore
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFont('helvetica', 'bold');
    doc.text('TOTALS SUMMARY', 100, finalY);
    doc.setFont('helvetica', 'normal');

    doc.text('Gross Pay:', 100, finalY + 10);
    doc.text(`$${slip.grossPay.toFixed(2)}`, 180, finalY + 10, { align: 'right' });

    doc.text('Tax Withheld:', 100, finalY + 15);
    doc.text(`$${slip.tax.toFixed(2)}`, 180, finalY + 15, { align: 'right' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('NET PAY (AUD):', 100, finalY + 25);
    doc.text(`$${slip.netPay.toFixed(2)}`, 180, finalY + 25, { align: 'right' });

    // Super info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text(`* Statutory Superannuation Contribution (11.5%): $${slip.superannuation.toFixed(2)}`, 20, finalY + 40);

    doc.setFontSize(9);
    doc.text('This payslip is generated automatically by Rosi Farm App.', 105, 280, { align: 'center' });

    // Save the PDF
    doc.save(`Payslip_${contract.lastName}_${slip.weekEnding}.pdf`);
}
