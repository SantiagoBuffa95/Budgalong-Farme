
"use client";

import { useState } from "react";
import { deleteUser } from "@/lib/invite-actions";

export default function DeleteUserButton({ employeeId, employeeName }: { employeeId: string, employeeName: string }) {
    const [loading, setLoading] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        if (!confirming) {
            setConfirming(true);
            setTimeout(() => setConfirming(false), 4000); // Reset after 4s
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await deleteUser(employeeId);
            if (!res.success) {
                setError(res.message || "Failed");
                setConfirming(false);
                setLoading(false);
            } else {
                window.location.reload();
            }
        } catch (err) {
            setError("Error");
            setConfirming(false);
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
            <button
                onClick={handleDelete}
                disabled={loading}
                className="btn-sm"
                title="Permanently remove user"
                style={{
                    background: confirming ? '#d32f2f' : '#f5f5f5',
                    color: confirming ? 'white' : '#d32f2f',
                    border: '1px solid #d32f2f',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    padding: '0.25rem 0.5rem',
                    marginLeft: '0.5rem',
                    transition: 'all 0.2s',
                    fontWeight: confirming ? 'bold' : 'normal'
                }}
            >
                {loading ? '...' : (confirming ? 'Really Delete?' : 'Delete')}
            </button>
            {error && <span style={{ color: 'red', fontSize: '0.75rem', marginLeft: '5px' }}>{error}</span>}
        </div>
    );
}
