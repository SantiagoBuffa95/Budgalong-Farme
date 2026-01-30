"use client";

import { useState } from "react";
import { regeneratePayslipPdf } from "@/lib/payroll-actions";

export default function DownloadPayslipButton({ timesheetId }: { timesheetId: string }) {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        setLoading(true);
        try {
            const res = await regeneratePayslipPdf(timesheetId);
            if (res.success && res.pdfBase64) {
                const byteCharacters = atob(res.pdfBase64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Payslip.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                alert("Download failed: " + (res.message || "Unknown error"));
            }
        } catch (e) {
            console.error(e);
            alert("Error downloading file");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleDownload}
            disabled={loading}
            className="btn-secondary"
            style={{ padding: '2px 8px', fontSize: '0.7rem', cursor: 'pointer' }}
        >
            {loading ? 'Downloading...' : '📥 Download PDF'}
        </button>
    );
}
