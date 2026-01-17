import Link from "next/link";
import styles from "./employee.module.css";
import LogoutButton from "../components/LogoutButton";
import { auth } from "@/auth";

export default async function EmployeeDashboard() {
    const session = await auth();
    const userName = session?.user?.name || "Employee";

    // Datos mock para visualización
    const employee = {
        name: userName,
        contract: "Full-Time",
        rate: "$28.50 / hr",
        status: "Local"
    };

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
                        <li><strong>Name:</strong> {employee.name}</li>
                        <li><strong>Contract Type:</strong> {employee.contract}</li>
                        <li><strong>Base Rate:</strong> {employee.rate}</li>
                        <li><strong>Legal Status:</strong> {employee.status}</li>
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
                    <p>Download your approved payment receipts.</p>
                    <div className={styles.emptyState}>No documents for this week yet.</div>
                </div>
            </div>
        </div>
    );
}
