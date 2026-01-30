"use client";

import { useState } from "react";
import { toggleEmployeeStatus } from "@/lib/invite-actions";

export default function StatusToggleButton({ employeeId, currentStatus, employeeName }: { employeeId: string, currentStatus: string, employeeName: string }) {
    const isActive = currentStatus === 'active';
    const [loading, setLoading] = useState(false);

    const handleToggle = async () => {
        if (!confirm(`Are you sure you want to ${isActive ? 'deactivate' : 'activate'} ${employeeName}?`)) return;

        setLoading(true);
        try {
            await toggleEmployeeStatus(employeeId, !isActive);
            window.location.reload(); // Simple refresh to show new state
        } catch (err) {
            alert("Status change failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            className="btn-sm"
            style={{
                background: isActive ? '#ffcccb' : '#c8e6c9',
                color: isActive ? '#c62828' : '#2e7d32',
                border: '1px solid currentColor',
                cursor: 'pointer',
                fontSize: '0.8rem',
                padding: '0.25rem 0.5rem',
                marginLeft: '0.5rem'
            }}
        >
            {loading ? '...' : (isActive ? 'Deactivate' : 'Activate')}
        </button>
    );
}
