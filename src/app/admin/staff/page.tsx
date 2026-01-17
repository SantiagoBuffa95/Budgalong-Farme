import Link from "next/link";
import styles from "./staff.module.css";
import { getContracts } from "@/lib/actions";

export const dynamic = 'force-dynamic';

export default async function StaffManagement() {
    const employees = await getContracts();

    return (
        <div className="container">
            <header className={styles.header}>
                <Link href="/admin" className={styles.backLink}>← Back to Admin</Link>
                <h1>Staff Management</h1>
                <p>Manage your team and their employment agreements</p>
            </header>

            <div className={styles.actions}>
                <Link href="/admin/contracts/new" className="btn btn-primary">+ New Employee Contract</Link>
            </div>

            <div className="card">
                {employees.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                        <p>No contracts found yet. Start by creating one!</p>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Contract Type</th>
                                <th>Hourly Rate</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((emp) => (
                                <tr key={emp.id}>
                                    <td><strong>{emp.firstName} {emp.lastName}</strong></td>
                                    <td style={{ textTransform: 'capitalize' }}>{emp.type}</td>
                                    <td>${emp.baseRate}</td>
                                    <td>
                                        <span className={`${styles.badge} ${styles[emp.status.toLowerCase().replace(' ', '')] || styles.active}`}>
                                            {emp.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button className={styles.editBtn}>Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
