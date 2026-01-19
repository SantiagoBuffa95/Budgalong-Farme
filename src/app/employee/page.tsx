export const dynamic = "force-dynamic";
import Link from "next/link";
import styles from "./employee.module.css";
import LogoutButton from "../components/LogoutButton";
import { getEmployeeDashboardData } from "@/lib/employee-actions";

export default async function EmployeeDashboard() {
    const data = await getEmployeeDashboardData();

    if (!data) {
        return (
            <div className="container">
                <header className={styles.header}>
                    <h1>My Profile at Budgalon</h1>
                </header>
                <div className="card">
                    <p>Profile not found. Please contact administration.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <header className={styles.header} style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '1rem', right: '0' }}>
                    <LogoutButton />
                </div>
                <h1>My Profile at Budgalon</h1>
            </header>

            <div className={styles.dashboardGrid}>
                <div className="card">
                    <h3>👤 My Details</h3>
                    <ul className={styles.infoList}>
                        <li><strong>Name:</strong> {data.preferredName || data.legalName}</li>
                        <li><strong>Leave Balance:</strong> {data.annualLeaveHours.toFixed(2)} hrs (Annual)</li>
                    </ul>
                </div>

                <div className="card">
                    <h3>⏰ My Hours</h3>
                    <p>Log your hours worked this week to generate your payment.</p>
                    <Link href="/employee/timesheet" className="btn btn-secondary">
                        Submit Weekly Hours
                    </Link>
                </div>
            </div>

            <div className={styles.payrollSection}>
                <div className="card">
                    <h3>📄 My Payslips (PDF)</h3>
                    {data.recentPayslips.length > 0 ? (
                        <ul className={styles.infoList}>
                            {data.recentPayslips.map(ps => (
                                <li key={ps.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <span>Pay Ending: {ps.payRunEnd} (${ps.net.toFixed(2)})</span>
                                    {ps.pdfUrl ? (
                                        <a href={ps.pdfUrl} target="_blank" className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>Download</a>
                                    ) : (
                                        <span style={{ fontSize: '0.7rem', color: '#666' }}>Processing...</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className={styles.emptyState}>No payslips available yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
