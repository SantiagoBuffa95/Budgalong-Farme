import Link from "next/link";
import styles from "./employee.module.css";
import LogoutButton from "../components/LogoutButton";
import { getEmployeeDashboardData } from "@/lib/employee-actions";
import Image from "next/image";
import DownloadPayslipButton from "./DownloadPayslipButton";

export default async function EmployeeDashboard() {
    const data = await getEmployeeDashboardData();

    if (!data) {
        return (
            <div className="container">
                <header className="header">
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                        <Image src="/brand/logo.png" alt="Budgalong" width={100} height={100} />
                    </div>
                    <h1>Budgalong</h1>
                </header>
                <div className="card">
                    <p>Profile not found. Please contact administration.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <header className="header" style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '1rem', right: '0' }}>
                    <LogoutButton />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <Image src="/brand/logo.png" alt="Budgalong" width={120} height={120} />
                </div>
                <h1>My Profile at Budgalong</h1>
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
                                    {ps.timesheetId ? (
                                        <DownloadPayslipButton timesheetId={ps.timesheetId} />
                                    ) : (
                                        <span style={{ fontSize: '0.7rem', color: '#666' }}>No timesheet</span>
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
