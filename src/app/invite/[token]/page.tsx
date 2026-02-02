"use client";

import { useActionState, use } from "react";
import { useFormStatus } from "react-dom";
import { acceptInvite } from "@/lib/invite-actions";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);

    const [validating, setValidating] = useState(true);
    const [validation, setValidation] = useState<any>(null);
    const [accepted, setAccepted] = useState(false);

    useEffect(() => {
        fetch(`/api/validate-invite?token=${token}`)
            .then((res) => res.json())
            .then((data) => {
                setValidation(data);
                setValidating(false);
            });
    }, [token]);

    type ActionState = { error?: string; success?: boolean } | undefined;

    async function handleAccept(prevState: ActionState, formData: FormData): Promise<ActionState> {
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (password !== confirmPassword) {
            return { error: "Passwords do not match." };
        }

        const result = await acceptInvite(token, email, password);

        if (result.success) {
            setAccepted(true);
            return { success: true };
        }

        return { error: result.error };
    }

    const [state, dispatch] = useActionState(handleAccept, undefined);

    if (validating) {
        return (
            <div className="container flex-center" style={{ minHeight: "80vh" }}>
                <div className="card" style={{ maxWidth: "500px", textAlign: "center" }}>
                    <Image src="/brand/logo.png" alt="Budgalong" width={100} height={100} />
                    <h2>Validating invite...</h2>
                </div>
            </div>
        );
    }

    if (!validation?.valid) {
        return (
            <div className="container flex-center" style={{ minHeight: "80vh" }}>
                <div className="card" style={{ maxWidth: "500px", textAlign: "center" }}>
                    <Image src="/brand/logo.png" alt="Budgalong" width={100} height={100} />
                    <h2 style={{ color: "var(--accent)" }}>Invalid Invite</h2>
                    <p>{validation?.error || "This invite link is invalid or has expired."}</p>
                    <a href="/login" className="btn btn-primary" style={{ marginTop: "1.5rem" }}>
                        Go to Login
                    </a>
                </div>
            </div>
        );
    }

    if (accepted || state?.success) {
        return (
            <div className="container flex-center" style={{ minHeight: "80vh" }}>
                <div className="card" style={{ maxWidth: "500px", textAlign: "center" }}>
                    <Image src="/brand/logo.png" alt="Budgalong" width={100} height={100} />
                    <h2>Welcome to Budgalong!</h2>
                    <p>Your account has been activated successfully.</p>
                    <a href="/login" className="btn btn-primary" style={{ marginTop: "1.5rem" }}>
                        Go to Login
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="container flex-center" style={{ minHeight: "80vh" }}>
            <div className="card" style={{ maxWidth: "500px", width: "100%" }}>
                <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                    <Image src="/brand/logo.png" alt="Budgalong" width={120} height={120} />
                    <h2>Complete Your Registration</h2>
                    <p style={{ color: "#666" }}>
                        Welcome, <strong>{validation.user.employeeName || validation.user.name}</strong>!
                    </p>
                </div>

                <form action={dispatch}>
                    <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            defaultValue={validation.user.email?.includes("@temp.budgalong") ? "" : validation.user.email}
                            placeholder="your.email@example.com"
                            required
                            style={{
                                width: "100%",
                                padding: "0.75rem",
                                border: "2px solid var(--pixel-border)",
                                borderRadius: "0",
                                fontSize: "1rem",
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                            Password (minimum 8 characters)
                        </label>
                        <input
                            type="password"
                            name="password"
                            minLength={8}
                            required
                            style={{
                                width: "100%",
                                padding: "0.75rem",
                                border: "2px solid var(--pixel-border)",
                                borderRadius: "0",
                                fontSize: "1rem",
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: "1.5rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            minLength={8}
                            required
                            style={{
                                width: "100%",
                                padding: "0.75rem",
                                border: "2px solid var(--pixel-border)",
                                borderRadius: "0",
                                fontSize: "1rem",
                            }}
                        />
                    </div>

                    {state?.error && (
                        <div
                            style={{
                                color: "var(--accent)",
                                marginBottom: "1rem",
                                padding: "0.75rem",
                                border: "2px solid var(--accent)",
                                backgroundColor: "rgba(255, 112, 67, 0.1)",
                            }}
                        >
                            {state.error}
                        </div>
                    )}

                    <SubmitButton />
                </form>
            </div>
        </div>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            className="btn btn-primary"
            disabled={pending}
            style={{ width: "100%", marginTop: "1rem" }}
        >
            {pending ? "Creating Account..." : "Activate Account"}
        </button>
    );
}
