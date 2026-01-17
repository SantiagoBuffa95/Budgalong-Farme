import Link from "next/link";
import styles from "./admin.module.css";
import LogoutButton from "../components/LogoutButton";

export default function AdminDashboard() {
    return (
        <div className="container">
            <header className={styles.header} style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '1rem', right: '0' }}>
                    <LogoutButton />
                </div>
                <h1>Admin Dashboard</h1>
                <p>Manage the legal and financial aspects of Budgalon</p>
            </header>

            <div className="grid-auto">
                <div className="card">
                    <div className={styles.icon}>⚖️</div>
                    <h3>Legal Section</h3>
                    <p>Check hiring laws and the updated Pastoral Award 2020.</p>
                    <Link href="/admin/legal" className="btn btn-primary">View Laws</Link>
                </div>

                <div className="card">
                    <div className={styles.icon}>📋</div>
                    <h3>Employee Contracts</h3>
                    <p>Manage profiles, contract types, and hourly rates for each worker.</p>
                    <Link href="/admin/staff" className="btn btn-primary">Manage Staff</Link>
                </div>

                <div className="card">
                    <div className={styles.icon}>✅</div>
                    <h3>Payroll Approvals</h3>
                    <p>Review submitted timesheets and generate PDF payslips.</p>
                    <Link href="/admin/payroll" className="btn btn-primary" style={{ width: '100%' }}>View & Approve</Link>
                </div>

                <div className="card">
                    <div className={styles.icon}>📊</div>
                    <h3>Payment Reports</h3>
                    <p>Analyze labor costs over time.</p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Link href="/admin/reports" className="btn btn-secondary">View Charts</Link>
                        <Link href="/admin/payroll/test" className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>Playground</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
