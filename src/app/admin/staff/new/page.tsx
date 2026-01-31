"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createEmployee, getAvailableUsers } from "@/lib/invite-actions";

type AvailableUser = { id: string; name: string | null; email: string | null };

export default function NewEmployeeWizard() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);

    // Load available users on mount
    useEffect(() => {
        async function loadUsers() {
            const users = await getAvailableUsers();
            setAvailableUsers(users);
        }
        loadUsers();
    }, []);

    // Form State
    const [formData, setFormData] = useState({
        // Step 1: Personal
        legalName: "",
        preferredName: "",
        email: "",
        phone: "",
        address: "",
        suburb: "",
        state: "NSW",
        postcode: "",
        dateOfBirth: "",
        tfn: "",
        linkUserId: "", // NEW: Link to existing user

        // Step 2: Employment
        startDate: new Date().toISOString().split('T')[0],
        contractType: "casual", // casual, full_time, part_time, salary
        classification: "Level 1",

        // Step 3: Pay
        ordinaryHoursPerWeek: 38,
        hourlyRate: "", // String for input, convert to number
        salaryAnnual: "",
        casualLoading: true,
        allowances: {
            dog: false,
            horse: false,
            firstAid: false,
            meal: false
        },

        // Step 4: Super
        superFundName: "",
        superMemberNumber: "",
        superUSI: "",
        superABN: ""
    });

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const updateAllowance = (key: string, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            allowances: { ...prev.allowances, [key]: checked }
        }));
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                ordinaryHoursPerWeek: Number(formData.ordinaryHoursPerWeek),
                hourlyRate: formData.hourlyRate ? Number(formData.hourlyRate) : undefined,
                salaryAnnual: formData.salaryAnnual ? Number(formData.salaryAnnual) : undefined,
                allowancesConfig: formData.allowances
            };

            const result = await createEmployee(payload);

            if (result.success) {
                router.push("/admin/staff");
            } else {
                setError(result.error || "Failed to create employee");
                setIsSubmitting(false);
            }
        } catch (err) {
            console.error(err);
            setError("An unexpected error occurred");
            setIsSubmitting(false);
        }
    };

    // Render Steps
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>

            {/* Progress Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', padding: '0 1rem' }}>
                {['Personal', 'Employment', 'Pay & Rates', 'Super', 'Review'].map((label, idx) => {
                    const stepNum = idx + 1;
                    const active = step >= stepNum;
                    return (
                        <div key={label} style={{ textAlign: 'center', flex: 1, opacity: active ? 1 : 0.4 }}>
                            <div style={{
                                width: '30px', height: '30px', borderRadius: '50%',
                                background: active ? 'var(--primary)' : '#ccc', color: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 0.5rem', fontWeight: 'bold'
                            }}>
                                {stepNum}
                            </div>
                            <small style={{ fontSize: '0.8rem', fontWeight: active ? 'bold' : 'normal' }}>{label}</small>
                        </div>
                    )
                })}
            </div>

            <div className="card" style={{ padding: '2rem' }}>
                {error && (
                    <div style={{ background: '#f8d7da', color: '#721c24', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                        {error}
                    </div>
                )}

                {/* STEP 1: PERSONAL */}
                {step === 1 && (
                    <div>
                        <h2 style={{ marginBottom: '1.5rem', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>Personal Details</h2>

                        {/* User Linking Section */}
                        {availableUsers.length > 0 && (
                            <div style={{ marginBottom: '2rem', padding: '1rem', background: '#e8f5e9', borderRadius: '8px', border: '1px solid #a5d6a7' }}>
                                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
                                    🔗 Link to Existing User Account (Optional)
                                </label>
                                <select
                                    value={formData.linkUserId}
                                    onChange={e => updateField('linkUserId', e.target.value)}
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid #ddd' }}
                                >
                                    <option value="">-- Create without user link (invite later) --</option>
                                    {availableUsers.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.name || 'No name'} ({u.email})
                                        </option>
                                    ))}
                                </select>
                                <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
                                    If you select a user, they&apos;ll be able to access their timesheet immediately.
                                </small>
                            </div>
                        )}

                        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="input-group">
                                <label>Legal Name *</label>
                                <input type="text" value={formData.legalName} onChange={e => updateField('legalName', e.target.value)} required />
                            </div>
                            <div className="input-group">
                                <label>Preferred Name</label>
                                <input type="text" value={formData.preferredName} onChange={e => updateField('preferredName', e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label>Email (for invite)</label>
                                <input type="email" value={formData.email} onChange={e => updateField('email', e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label>Phone</label>
                                <input type="tel" value={formData.phone} onChange={e => updateField('phone', e.target.value)} />
                            </div>
                        </div>

                        <h3 style={{ marginTop: '2rem', fontSize: '1.1rem' }}>Address (Optional)</h3>
                        <div className="input-group">
                            <label>Street Address</label>
                            <input type="text" value={formData.address} onChange={e => updateField('address', e.target.value)} />
                        </div>
                        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                            <div className="input-group">
                                <label>Suburb</label>
                                <input type="text" value={formData.suburb} onChange={e => updateField('suburb', e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label>State</label>
                                <select value={formData.state} onChange={e => updateField('state', e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid #ddd' }}>
                                    <option value="NSW">NSW</option>
                                    <option value="VIC">VIC</option>
                                    <option value="QLD">QLD</option>
                                    <option value="WA">WA</option>
                                    <option value="SA">SA</option>
                                    <option value="TAS">TAS</option>
                                    <option value="NT">NT</option>
                                    <option value="ACT">ACT</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Postcode</label>
                                <input type="text" value={formData.postcode} onChange={e => updateField('postcode', e.target.value)} />
                            </div>
                        </div>

                        <h3 style={{ marginTop: '2rem', fontSize: '1.1rem' }}>Tax & Identity (Secure)</h3>
                        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="input-group">
                                <label>Date of Birth</label>
                                <input type="date" value={formData.dateOfBirth} onChange={e => updateField('dateOfBirth', e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label>TFN (Tax File Number)</label>
                                <input
                                    type="text"
                                    value={formData.tfn}
                                    onChange={e => updateField('tfn', e.target.value)}
                                    placeholder="locked & encrypted"
                                    style={{ background: '#f8f9fa' }}
                                />
                                <small style={{ color: '#666' }}>Stored with AES-256 encryption.</small>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: EMPLOYMENT */}
                {step === 2 && (
                    <div>
                        <h2 style={{ marginBottom: '1.5rem', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>Employment Details</h2>

                        <div className="input-group">
                            <label>Start Date *</label>
                            <input type="date" value={formData.startDate} onChange={e => updateField('startDate', e.target.value)} required />
                        </div>

                        <div className="input-group" style={{ marginTop: '1.5rem' }}>
                            <label>Employment Type *</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                                {['casual', 'full_time', 'part_time', 'salary'].map(type => (
                                    <label key={type} style={{
                                        padding: '1rem', border: formData.contractType === type ? '2px solid var(--primary)' : '1px solid #ddd',
                                        borderRadius: '8px', cursor: 'pointer', background: formData.contractType === type ? '#f0fdf4' : '#fff',
                                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                                    }}>
                                        <input
                                            type="radio"
                                            name="contractType"
                                            value={type}
                                            checked={formData.contractType === type}
                                            onChange={e => updateField('contractType', e.target.value)}
                                            style={{ accentColor: 'var(--primary)' }}
                                        />
                                        <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{type.replace('_', ' ')}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="input-group" style={{ marginTop: '1.5rem' }}>
                            <label>Classification / Level</label>
                            <select
                                value={formData.classification}
                                onChange={e => updateField('classification', e.target.value)}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid #ddd' }}
                            >
                                <option value="Level 1">Level 1 - General Farm Hand</option>
                                <option value="Level 2">Level 2 - Experienced Station Hand</option>
                                <option value="Level 3">Level 3 - Senior Station Hand</option>
                                <option value="Level 4">Level 4 - Overseer</option>
                                <option value="Level 5">Level 5 - Manager</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* STEP 3: PAY & RATES */}
                {step === 3 && (
                    <div>
                        <h2 style={{ marginBottom: '1.5rem', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>Pay & Rates</h2>

                        {formData.contractType === 'salary' ? (
                            <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                                <h3 style={{ margin: 0, marginBottom: '1rem' }}>Annual Salary Package</h3>
                                <div className="input-group">
                                    <label>Annual Salary ($)</label>
                                    <input
                                        type="number"
                                        value={formData.salaryAnnual}
                                        onChange={e => updateField('salaryAnnual', e.target.value)}
                                        placeholder="e.g. 85000"
                                        style={{ fontSize: '1.2rem', padding: '1rem' }}
                                    />
                                </div>
                                <div className="input-group" style={{ marginTop: '1rem' }}>
                                    <label>Ordinary Hours Per Week</label>
                                    <input type="number" value={formData.ordinaryHoursPerWeek} onChange={e => updateField('ordinaryHoursPerWeek', e.target.value)} />
                                    <small>Usually 38. Used to calculate internal hourly rate.</small>
                                </div>
                            </div>
                        ) : (
                            <div style={{ background: '#fff', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                                <div className="input-group">
                                    <label>Base Hourly Rate ($)</label>
                                    <input
                                        type="number"
                                        value={formData.hourlyRate}
                                        onChange={e => updateField('hourlyRate', e.target.value)}
                                        placeholder="e.g. 24.50"
                                        step="0.01"
                                    />
                                </div>

                                {formData.contractType === 'casual' && (
                                    <div style={{ marginTop: '1rem', padding: '1rem', background: '#e6fffa', borderRadius: '8px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.casualLoading}
                                                onChange={e => updateField('casualLoading', e.target.checked)}
                                            />
                                            <strong>Apply 25% Casual Loading automatically?</strong>
                                        </label>
                                        <p style={{ margin: '0.5rem 0 0 1.8rem', fontSize: '0.9rem', color: '#666' }}>
                                            If checked, payroll will add 25% to the base rate during payslip generation.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        <h3 style={{ marginTop: '2rem', fontSize: '1.1rem' }}>Allowances Config</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <label className="checkbox-card" style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '0.5rem' }}>
                                <input type="checkbox" checked={formData.allowances.dog} onChange={e => updateAllowance('dog', e.target.checked)} />
                                Dog Allowance
                            </label>
                            <label className="checkbox-card" style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '0.5rem' }}>
                                <input type="checkbox" checked={formData.allowances.horse} onChange={e => updateAllowance('horse', e.target.checked)} />
                                Horse Allowance
                            </label>
                            <label className="checkbox-card" style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '0.5rem' }}>
                                <input type="checkbox" checked={formData.allowances.firstAid} onChange={e => updateAllowance('firstAid', e.target.checked)} />
                                First Aid
                            </label>
                            <label className="checkbox-card" style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '0.5rem' }}>
                                <input type="checkbox" checked={formData.allowances.meal} onChange={e => updateAllowance('meal', e.target.checked)} />
                                Meal Allowance
                            </label>
                        </div>
                    </div>
                )}

                {/* STEP 4: SUPERANNUATION */}
                {step === 4 && (
                    <div>
                        <h2 style={{ marginBottom: '1.5rem', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>Superannuation (Optional)</h2>
                        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                            Enter the employee&apos;s choice of fund. If left blank, you can default to the employer&apos;s default fund later.
                        </p>

                        <div className="input-group">
                            <label>Super Fund Name</label>
                            <input type="text" value={formData.superFundName} onChange={e => updateField('superFundName', e.target.value)} placeholder="e.g. AustralianSuper" />
                        </div>
                        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
                            <div className="input-group">
                                <label>Member Number</label>
                                <input type="text" value={formData.superMemberNumber} onChange={e => updateField('superMemberNumber', e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label>USI (Unique Super Id)</label>
                                <input type="text" value={formData.superUSI} onChange={e => updateField('superUSI', e.target.value)} />
                            </div>
                        </div>
                        <div className="input-group" style={{ marginTop: '1rem' }}>
                            <label>Fund ABN</label>
                            <input type="text" value={formData.superABN} onChange={e => updateField('superABN', e.target.value)} />
                        </div>
                    </div>
                )}

                {/* STEP 5: REVIEW */}
                {step === 5 && (
                    <div>
                        <h2 style={{ marginBottom: '1.5rem', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>Review & Submit</h2>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <ReviewItem label="Name" value={`${formData.legalName} (${formData.preferredName})`} />
                            <ReviewItem label="Employment Type" value={formData.contractType.toUpperCase().replace('_', ' ')} />
                            <ReviewItem label="Start Date" value={formData.startDate} />

                            {formData.contractType === 'salary' ? (
                                <ReviewItem label="Annual Salary" value={`$${formData.salaryAnnual}`} />
                            ) : (
                                <ReviewItem label="Hourly Rate" value={`$${formData.hourlyRate} ${formData.casualLoading ? '(+25% Casual Loading Active)' : ''}`} />
                            )}

                            <ReviewItem label="TFN" value={formData.tfn ? "Provided (Encrypted)" : "Not provided"} />
                            <ReviewItem label="Super Fund" value={formData.superFundName || "Not provided"} />
                        </div>

                        <div style={{ marginTop: '2rem', padding: '1rem', background: '#fff3cd', borderRadius: '8px', color: '#856404' }}>
                            <strong>⚠ Final Check</strong>
                            <p style={{ margin: '0.5rem 0 0' }}>Creating this employee will generate a contract draft and allowing invite generation. Please confirm all details are correct.</p>
                        </div>
                    </div>
                )}

                {/* NAVIGATION BUTTONS */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
                    {step > 1 ? (
                        <button onClick={prevStep} className="btn btn-secondary">← Back</button>
                    ) : (
                        <Link href="/admin/staff" className="btn btn-secondary">Cancel</Link>
                    )}

                    {step < 5 ? (
                        <button onClick={nextStep} className="btn btn-primary" disabled={!formData.legalName}>Next Step →</button>
                    ) : (
                        <button onClick={handleSubmit} className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Confirm & Create Employee'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function ReviewItem({ label, value }: { label: string, value: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
            <span style={{ color: '#666' }}>{label}</span>
            <strong style={{ textAlign: 'right' }}>{value}</strong>
        </div>
    );
}
