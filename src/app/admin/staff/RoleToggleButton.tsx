"use client";

import { useState } from "react";
import { toggleAdminRole } from "@/lib/invite-actions";

export default function RoleToggleButton({ employeeId, currentRole, employeeName }: { employeeId: string, currentRole?: string, employeeName: string }) {
    const isAdmin = currentRole === 'admin';
    const [loading, setLoading] = useState(false);

    const handleToggle = async () => {
        const action = isAdmin ? 'remove Admin rights from' : 'PRAMOTE to Admin';
        if (!confirm(`Are you sure you want to ${action} ${employeeName}?`)) return;

        setLoading(true);
        try {
            const res = await toggleAdminRole(employeeId, !isAdmin);
            if (res.success) {
                window.location.reload();
            } else {
                alert("Failed: " + res.message);
            }
        } catch (err) {
            alert("Role change failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            className="btn-sm"
            title={isAdmin ? "Demote to Employee" : "Promote to Admin"}
            style={{
                background: isAdmin ? '#673ab7' : '#f5f5f5',
                color: isAdmin ? 'white' : '#666',
                border: '1px solid #ccc',
                cursor: 'pointer',
                fontSize: '0.8rem',
                padding: '0.25rem 0.5rem',
                marginLeft: '0.5rem',
                fontWeight: isAdmin ? 'bold' : 'normal'
            }}
        >
            {loading ? '...' : (isAdmin ? 'Admin' : 'Staff')}
        </button>
    );
}
