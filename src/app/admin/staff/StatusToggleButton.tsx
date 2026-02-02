"use client";

import { useState } from "react";
import { toggleEmployeeStatus } from "@/lib/invite-actions";

export default function StatusToggleButton({ employeeId, currentStatus, employeeName }: { employeeId: string, currentStatus: string, employeeName: string }) {
    const isActive = currentStatus === 'active';
    const [loading, setLoading] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleToggle = async () => {
        if (!confirming) {
            setConfirming(true);
            setTimeout(() => setConfirming(false), 4000); // Reset after 4s
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await toggleEmployeeStatus(employeeId, !isActive);
            window.location.reload();
        } catch (err) {
            setError("Failed");
            setConfirming(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
            <button
                onClick={handleToggle}
                disabled={loading}
                className="btn-sm"
                style={{
                    background: confirming ? '#ff9800' : (isActive ? '#ffcccb' : '#c8e6c9'),
                    color: confirming ? 'white' : (isActive ? '#c62828' : '#2e7d32'),
                    border: '1px solid currentColor',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    padding: '0.25rem 0.5rem',
                    marginLeft: '0.5rem',
                    transition: 'all 0.2s',
                    fontWeight: confirming ? 'bold' : 'normal'
                }}
            >
                {loading ? '...' : (confirming ? 'Confirm?' : (isActive ? 'Deactivate' : 'Activate'))}
            </button>
            {error && <span style={{ color: 'red', fontSize: '0.75rem', marginLeft: '5px' }}>{error}</span>}
        </div>
    );
}
