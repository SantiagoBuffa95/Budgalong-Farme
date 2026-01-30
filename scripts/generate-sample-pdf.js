
const fs = require('fs');
const { jsPDF } = require('jspdf');
// Correct way to import autoTable in Node script environment
const autoTable = require('jspdf-autotable').default;

// Mock Data matching your example
const data = {
    id: '11950186',
    farmName: 'R G & M A SUTHERLAND',
    farmAbn: '82639958530',
    employeeName: 'Santiago Buffa',
    employeeAddress: 'Budgalong\nWellington NSW 2820',
    payRunStart: '17/08/2025',
    payRunEnd: '23/08/2025',
    payDate: '21/08/2025',
    baseRate: 30.35,
    totalHours: 38,
    gross: 922.70,
    tax: 138.00,
    super: 110.72,
    net: 784.70,
    lines: [
        { description: 'Casual Ordinary Hours', units: 38.00, rate: 24.28, amount: 922.70 }
    ],
    superFundName: 'COMMONWEALTH ESSENTIAL SUPER',
    superMemberId: '**********5473',
    bankAccountName: 'Santiago Buffa',
    bankAccountNo: '062231 - ****9351',
    tfn: '*** *** 123'
};

async function generateSample() {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // --- Header Right (Company Info) ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(data.farmName.toUpperCase(), pageWidth - 15, 20, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    let topY = 26;
    const lineHeight = 5;

    if (data.farmAbn) {
        doc.text(`ABN:`, pageWidth - 80, topY);
        doc.text(data.farmAbn, pageWidth - 15, topY, { align: 'right' });
        topY += lineHeight;
    }

    doc.text(`Period Starting:`, pageWidth - 80, topY);
    doc.text(data.payRunStart, pageWidth - 15, topY, { align: 'right' });
    topY += lineHeight;

    doc.text(`Period Ending:`, pageWidth - 80, topY);
    doc.text(data.payRunEnd, pageWidth - 15, topY, { align: 'right' });
    topY += lineHeight;

    doc.text(`Date Paid:`, pageWidth - 80, topY);
    doc.text(data.payDate, pageWidth - 15, topY, { align: 'right' });
    topY += lineHeight;

    doc.text(`Employee Id:`, pageWidth - 80, topY);
    doc.text(data.id.slice(0, 8), pageWidth - 15, topY, { align: 'right' });
    topY += lineHeight + 5;

    // --- Summary Box (Right) ---
    if (data.baseRate) {
        doc.text(`Base Pay Rate:`, pageWidth - 80, topY);
        doc.text(`$${data.baseRate.toFixed(2)} Per Hour`, pageWidth - 15, topY, { align: 'right' });
        topY += lineHeight;
    }

    if (data.totalHours) {
        doc.text(`Hours Paid:`, pageWidth - 80, topY);
        doc.text(data.totalHours.toFixed(2), pageWidth - 15, topY, { align: 'right' });
        topY += lineHeight;
    }

    doc.setFont('helvetica', 'bold');
    doc.text(`Gross Earnings:`, pageWidth - 80, topY);
    doc.text(`$${data.gross.toFixed(2)}`, pageWidth - 15, topY, { align: 'right' });
    topY += lineHeight;

    doc.text(`Net Payment:`, pageWidth - 80, topY);
    doc.text(`$${data.net.toFixed(2)}`, pageWidth - 15, topY, { align: 'right' });
    topY += lineHeight;

    doc.setFont('helvetica', 'normal');
    doc.text(`Super Payments:`, pageWidth - 80, topY);
    doc.text(`$${data.super.toFixed(2)}`, pageWidth - 15, topY, { align: 'right' });


    // --- Employee Address (Left) ---
    const leftY = 80;
    doc.setFont('helvetica', 'normal');

    doc.text(data.employeeName, 15, leftY);
    if (data.employeeAddress) {
        const addressLines = doc.splitTextToSize(data.employeeAddress, 80);
        doc.text(addressLines, 15, leftY + 5);
    }
    doc.text("Australia", 15, leftY + 15);


    // --- TABLES ---
    let currentY = 110;

    // Common styles
    const tableStyles = {
        theme: 'grid',
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1, lineColor: [200, 200, 200] },
        bodyStyles: { lineWidth: 0.1, lineColor: [220, 220, 220] },
        styles: { fontSize: 9, cellPadding: 3, valign: 'middle' },
    };

    // 1. Wages
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text("Pay Slip Components", 15, currentY);

    const wagesBody = data.lines.map(l => [
        l.description,
        l.units.toFixed(2),
        `$${l.rate.toFixed(2)}`,
        `$${l.amount.toFixed(2)}`,
        `$${l.amount.toFixed(2)}`
    ]);

    autoTable(doc, {
        startY: currentY + 5,
        head: [['Wages and Earnings', 'Hours/Units', 'Rate', 'This Pay', 'Year To Date']],
        body: wagesBody,
        ...tableStyles,
        columnStyles: {
            0: { cellWidth: 'auto', halign: 'left' },
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right', fontStyle: 'bold' },
            4: { halign: 'right' }
        },
    });

    currentY = doc.lastAutoTable.finalY + 10;

    // 2. Taxes
    autoTable(doc, {
        startY: currentY,
        head: [['Taxes', '', '', 'This Pay', 'Year To Date']],
        body: [['PAYG', '', '', `$${data.tax.toFixed(2)}`, `$${data.tax.toFixed(2)}`]],
        ...tableStyles,
        columnStyles: {
            0: { cellWidth: 'auto', halign: 'left' },
            3: { halign: 'right', fontStyle: 'bold' },
            4: { halign: 'right' }
        },
    });

    currentY = doc.lastAutoTable.finalY + 10;

    // 3. Super
    autoTable(doc, {
        startY: currentY,
        head: [['Superannuation Breakdown', '', '', 'This Pay', 'Year To Date']],
        body: [['SG', '', '', `$${data.super.toFixed(2)}`, `$${data.super.toFixed(2)}`]],
        ...tableStyles,
        columnStyles: {
            0: { cellWidth: 'auto', halign: 'left' },
            3: { halign: 'right', fontStyle: 'bold' },
            4: { halign: 'right' }
        },
    });

    // @ts-ignore
    currentY = doc.lastAutoTable.finalY + 15;

    // 4. Bank
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text("Bank Payments", 15, currentY);
    doc.text("Account", 130, currentY);
    doc.text("This Pay", 170, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    currentY += 6;
    doc.text(data.bankAccountName, 15, currentY);
    doc.text(data.bankAccountNo, 130, currentY);
    doc.text(`$${data.net.toFixed(2)}`, 170, currentY);

    currentY += 15;

    // Super Fund
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text("Super Contributions", 15, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text("(Super payments are processed on a quarterly basis)", 60, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text("Member Number", 130, currentY);
    doc.text("This Pay", 170, currentY);

    currentY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(data.superFundName, 15, currentY);
    doc.text("Super Guarantee", 80, currentY);
    doc.text(data.superMemberId, 130, currentY);
    doc.text(`$${data.super.toFixed(2)}`, 170, currentY);

    // Save
    fs.writeFileSync('C:/Users/santi/OneDrive/Documentos/Prueba Budgalon app/rosi/public/sample_payslip.pdf', Buffer.from(doc.output('arraybuffer')));
    console.log('PDF Generated!');
}

generateSample();
