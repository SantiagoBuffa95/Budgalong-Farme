export const dynamic = "force-dynamic";
import Link from "next/link";
import styles from "./admin.module.css";
import LogoutButton from "../components/LogoutButton";
import { getAdminStats } from "@/lib/reports-actions";
import Image from "next/image";

export default async function AdminDashboard() {
    const stats = await getAdminStats();

    return (
        <div className="container">
            <header className="header" style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '1rem', right: '0' }}>
                    <LogoutButton />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <Image src="/brand/logo.png" alt="Budgalong" width={120} height={120} />
                </div>
                <h1>Budgalong Admin</h1>
                <p>Management & Financial Operations</p>
            </header>

            <div className="grid-auto">
                <div className="card">
                    <div className={styles.icon}>📋</div>
                    <h3>Staff & Contracts</h3>
                    <p><strong>{stats.activeEmployees}</strong> Active Employees</p>
                    <p><strong>{stats.contractsDraft}</strong> Draft Contracts</p>
                    <Link href="/admin/staff" className="btn btn-primary">Manage Staff</Link>
                </div>

                <div className="card">
                    <div className={styles.icon}>✅</div>
                    <h3>Payroll Approvals</h3>
                    <p><strong>{stats.pendingTimesheets}</strong> Pending Timesheets</p>
                    <p>Last Pay Run: {stats.lastPayRunDate || "Never"}</p>
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

                <div className="card">
                    <div className={styles.icon}>⚖️</div>
                    <h3>Legal Section</h3>
                    <p>Check hiring laws and the Pastoral Award 2020.</p>
                    <Link href="/admin/legal" className="btn btn-primary">View Laws</Link>
                </div>
            </div>
        </div>
    );
}
