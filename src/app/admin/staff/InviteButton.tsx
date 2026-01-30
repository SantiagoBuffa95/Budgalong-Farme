"use client";

import { useState } from "react";
import { generateInviteToken } from "@/lib/invite-actions";

export default function InviteButton({ employeeId, employeeName }: { employeeId: string; employeeName: string }) {
    const [loading, setLoading] = useState(false);
    const [inviteLink, setInviteLink] = useState<string | null>(null);

    async function handleGenerateInvite() {
        setLoading(true);
        const result = await generateInviteToken(employeeId);
        setLoading(false);

        if (result.error) {
            alert(result.error);
            return;
        }

        if (result.inviteLink) {
            setInviteLink(result.inviteLink);
        }
    }

    async function copyToClipboard() {
        if (inviteLink) {
            await navigator.clipboard.writeText(inviteLink);
            alert("Invite link copied to clipboard!");
        }
    }

    if (inviteLink) {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ fontSize: "0.85rem", padding: "0.5rem", background: "#f0f0f0", border: "2px solid var(--pixel-border)", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {inviteLink}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={copyToClipboard} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>
                        Copy Link
                    </button>
                    <button onClick={() => setInviteLink(null)} className="btn" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", background: "#ccc" }}>
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={handleGenerateInvite}
            disabled={loading}
            className="btn btn-primary"
            style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
        >
            {loading ? "Generating..." : "Send Invite"}
        </button>
    );
}
