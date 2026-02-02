"use client";

import { useState } from "react";
import { generateInviteToken } from "@/lib/invite-actions";

export default function InviteButton({ employeeId }: { employeeId: string; employeeName: string }) {
    const [loading, setLoading] = useState(false);
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    async function handleGenerateInvite() {
        setLoading(true);
        setError(null);
        try {
            const result = await generateInviteToken(employeeId);
            if (result.error) {
                setError(result.error);
            } else if (result.inviteLink) {
                setInviteLink(result.inviteLink);
            }
        } catch {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    }

    async function copyToClipboard() {
        if (inviteLink) {
            await navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    if (inviteLink) {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ fontSize: "0.85rem", padding: "0.5rem", background: "#e0f2f1", border: "1px solid #b2dfdb", borderRadius: '4px', maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: 'nowrap' }}>
                    {inviteLink}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={copyToClipboard} className="btn badge" style={{ cursor: 'pointer', background: copied ? '#4caf50' : '#2196f3', color: 'white', border: 'none' }}>
                        {copied ? "✓ Copied!" : "📋 Copy Link"}
                    </button>
                    <button onClick={() => setInviteLink(null)} className="btn badge" style={{ cursor: 'pointer', background: "#9e9e9e", color: 'white', border: 'none' }}>
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <button
                onClick={handleGenerateInvite}
                disabled={loading}
                className="btn badge"
                style={{ cursor: 'pointer', background: 'var(--accent)', color: 'white', border: 'none' }}
            >
                {loading ? "..." : "✉ Send Invite"}
            </button>
            {error && <small style={{ color: 'red', fontSize: '0.7rem', marginTop: '2px', maxWidth: '150px' }}>{error}</small>}
        </div>
    );
}
