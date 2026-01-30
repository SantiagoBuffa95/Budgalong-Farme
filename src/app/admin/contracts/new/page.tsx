"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./wizard.module.css";
import { saveContract } from "@/lib/actions";

export default function ContractWizard() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        type: "full_time" as "full_time" | "part_time" | "casual" | "salary" | "contractor",
        classification: "FLH1",
        baseRate: 28.26,
        salaryAnnual: 60000,
        superannuation: true,
        allowances: {
            dog: false,
            horse: false,
            firstAid: false,
            meal: false,
        },
        deductions: {
            accommodation: 0,
            meat: 0,
        }
    });

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type !== 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const toggleAllowance = (key: string) => {
        setFormData(prev => ({
            ...prev,
            allowances: { ...prev.allowances, [key]: !prev.allowances[key as keyof typeof prev.allowances] }
        }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const result = await saveContract(formData);
        if (result.success) {
            alert("Contract saved successfully!");
            router.push("/admin/staff");
        } else {
            alert("Error saving contract: " + result.message);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container">
            <header className={styles.header}>
                <Link href="/admin/staff" className="btn btn-secondary">← Cancel</Link>
                <h1>New Contract Wizard</h1>
                <div className={styles.progressBar}>
                    <div className={`${styles.step} ${step >= 1 ? styles.active : ''}`}>1</div>
                    <div className={styles.line}></div>
                    <div className={`${styles.step} ${step >= 2 ? styles.active : ''}`}>2</div>
                    <div className={styles.line}></div>
                    <div className={`${styles.step} ${step >= 3 ? styles.active : ''}`}>3</div>
                    <div className={styles.line}></div>
                    <div className={`${styles.step} ${step >= 4 ? styles.active : ''}`}>4</div>
                </div>
            </header>

            <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>

                {/* STEP 1: Personal Details */}
                {step === 1 && (
                    <div className={styles.stepContent}>
                        <h2>Step 1: Who are we hiring?</h2>
                        <div className={styles.grid2}>
                            <div className={styles.inputGroup}>
                                <label>First Name</label>
                                <input
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Jack"
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Last Name</label>
                                <input
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Thompson"
                                />
                            </div>
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Email Address</label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="jack@email.com"
                            />
                        </div>
                        <div className={styles.buttons}>
                            <button className="btn btn-primary" onClick={nextStep}>Next: Agreement Type</button>
                        </div>
                    </div>
                )}

                {/* STEP 2: Relationship */}
                {step === 2 && (
                    <div className={styles.stepContent}>
                        <h2>Step 2: Employment Relationship</h2>
                        <p>Is this a standard employee or an independent contractor?</p>

                        <div className={styles.typeSelector} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <button
                                className={`${styles.typeBtn} ${formData.type === 'full_time' ? styles.selected : ''}`}
                                onClick={() => setFormData({ ...formData, type: 'full_time' })}
                            >
                                👤 Full-Time
                                <small>Permanent, 38hrs/wk, leave accruals.</small>
                            </button>
                            <button
                                className={`${styles.typeBtn} ${formData.type === 'part_time' ? styles.selected : ''}`}
                                onClick={() => setFormData({ ...formData, type: 'part_time' })}
                            >
                                👤 Part-Time
                                <small>Fixed hours, pro-rata leave.</small>
                            </button>
                            <button
                                className={`${styles.typeBtn} ${formData.type === 'casual' ? styles.selected : ''}`}
                                onClick={() => setFormData({ ...formData, type: 'casual' })}
                            >
                                👥 Casual
                                <small>25% loading, no leave, flexible.</small>
                            </button>
                            <button
                                className={`${styles.typeBtn} ${formData.type === 'salary' ? styles.selected : ''}`}
                                onClick={() => setFormData({ ...formData, type: 'salary' })}
                            >
                                💸 Salary
                                <small>Fixed annual pay, overtime included.</small>
                            </button>
                            <button
                                className={`${styles.typeBtn} ${formData.type === 'contractor' ? styles.selected : ''}`}
                                onClick={() => setFormData({ ...formData, type: 'contractor' })}
                            >
                                🛠️ Contractor
                                <small>Invoices for services. No tax/super.</small>
                            </button>
                        </div>

                        <div className={styles.buttons}>
                            <button className="btn btn-secondary" onClick={prevStep}>Back</button>
                            <button className="btn btn-primary" onClick={nextStep}>Next: Classification</button>
                        </div>
                    </div>
                )}

                {/* STEP 3: Level & Rates */}
                {step === 3 && (
                    <div className={styles.stepContent}>
                        <h2>Step 3: Classification & Pay</h2>

                        {formData.type === 'salary' ? (
                            <>
                                <div className={styles.inputGroup}>
                                    <label>Annual Salary ($AUD Gross)</label>
                                    <input
                                        name="salaryAnnual"
                                        type="number"
                                        value={formData.salaryAnnual}
                                        onChange={handleInputChange}
                                        placeholder="60000"
                                    />
                                    <small>Weekly pay will be calculated as Annual / 52.</small>
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Award Classification (For reference)</label>
                                    <select
                                        name="classification"
                                        value={formData.classification}
                                        onChange={handleInputChange}
                                    >
                                        <option value="FLH7">FLH7 - Station Manager</option>
                                        <option value="FLH5">FLH5 - Senior Station Hand</option>
                                    </select>
                                </div>
                            </>
                        ) : formData.type !== 'contractor' ? (
                            <>
                                <div className={styles.inputGroup}>
                                    <label>Award Level (Pastoral Award 2020)</label>
                                    <select
                                        name="classification"
                                        value={formData.classification}
                                        onChange={handleInputChange}
                                    >
                                        <option value="FLH1">FLH1 - Intro / Less than 12 months exp</option>
                                        <option value="FLH3">FLH3 - Experienced Station Hand</option>
                                        <option value="FLH5">FLH5 - Senior Station Hand (Supervisor)</option>
                                        <option value="FLH7">FLH7 - Station Manager</option>
                                    </select>
                                </div>

                                <div className={styles.infoBox}>
                                    <strong>Suggested Min Rate ({formData.type === 'casual' ? 'Casual' : 'Permanent'}):</strong> {formData.type === 'casual' ? '$32.50' : '$26.00'} / hr
                                    <br />
                                    <small>{formData.type === 'casual' ? 'Includes 25% casual loading.' : 'Base rate for permanent staff.'}</small>
                                </div>

                                <div className={styles.inputGroup}>
                                    <label>Agreed Base Hourly Rate ($AUD)</label>
                                    <input
                                        name="baseRate"
                                        type="number"
                                        value={formData.baseRate}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className={styles.inputGroup}>
                                <label>Contractor Agreed Rate ($AUD)</label>
                                <input
                                    name="baseRate"
                                    type="number"
                                    value={formData.baseRate}
                                    onChange={handleInputChange}
                                    placeholder="e.g. 50.00 or Flat Rate"
                                />
                            </div>
                        )}

                        <div className={styles.buttons}>
                            <button className="btn btn-secondary" onClick={prevStep}>Back</button>
                            <button className="btn btn-primary" onClick={nextStep}>Next: Allowances</button>
                        </div>
                    </div>
                )}

                {/* STEP 4: Allowances */}
                {step === 4 && (
                    <div className={styles.stepContent}>
                        <h2>Step 4: Allowances & Deductions</h2>

                        <h3>Add-ons (Allowances)</h3>
                        <div className={styles.toggles}>
                            <label className={styles.checkbox}>
                                <input
                                    type="checkbox"
                                    checked={formData.allowances.dog}
                                    onChange={() => toggleAllowance('dog')}
                                />
                                <span>🐶 Dog Allowance (Uses own dogs)</span>
                            </label>
                            <label className={styles.checkbox}>
                                <input
                                    type="checkbox"
                                    checked={formData.allowances.horse}
                                    onChange={() => toggleAllowance('horse')}
                                />
                                <span>🐎 Horse Allowance (Uses own horse)</span>
                            </label>
                            <label className={styles.checkbox}>
                                <input
                                    type="checkbox"
                                    checked={formData.allowances.firstAid}
                                    onChange={() => toggleAllowance('firstAid')}
                                />
                                <span>🚑 First Aid Officer</span>
                            </label>
                        </div>

                        <h3 style={{ marginTop: '2rem' }}>Deductions</h3>
                        <div className={styles.inputGroup}>
                            <label>Accommodation / Keep ($ per week)</label>
                            <input
                                type="number"
                                value={formData.deductions.accommodation}
                                onChange={(e) => setFormData({ ...formData, deductions: { ...formData.deductions, accommodation: parseFloat(e.target.value) || 0 } })}
                            />
                            <small>Only if providing full board and lodging.</small>
                        </div>

                        <div className={styles.buttons}>
                            <button className="btn btn-secondary" onClick={prevStep}>Back</button>
                            <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Finish & Save Contract'}
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
