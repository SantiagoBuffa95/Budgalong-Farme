import Link from "next/link";
import styles from "./staff.module.css";
import { getEmployees } from "@/lib/invite-actions";
import InviteButton from "./InviteButton";
import StatusToggleButton from "./StatusToggleButton";
import RoleToggleButton from "./RoleToggleButton";

export const dynamic = 'force-dynamic';

export default async function StaffManagement() {
    const employees = await getEmployees();

    return (
        <div className="container">
            <header className="header">
                <Link href="/admin" className="btn btn-secondary" style={{ marginBottom: '1rem', display: 'inline-block' }}>← Back to Admin</Link>
                <h1>Staff Management</h1>
                <p>Manage your team and send invite links</p>
                <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                    <p>💡 Tip: You can promote staff to <strong>Admin</strong> status here. Admins have full access to payroll and settings.</p>
                </div>
            </header>

            <div style={{ marginBottom: '2rem' }}>
                <Link href="/admin/staff/new" className="btn btn-primary">+ Add New Employee</Link>
            </div>

            <div className="card">
                {employees.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                        <p>No employees found yet. Start by adding one!</p>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Account</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((emp) => (
                                <tr key={emp.id}>
                                    <td><strong>{emp.legalName}</strong></td>
                                    <td>{emp.email || '—'}</td>
                                    <td>
                                        {emp.hasAccount ? (
                                            <RoleToggleButton employeeId={emp.id} currentRole={emp.role} employeeName={emp.legalName} />
                                        ) : (
                                            <span style={{ color: '#ccc', fontSize: '0.8rem' }}>—</span>
                                        )}
                                    </td>
                                    <td style={{ textTransform: 'capitalize' }}>{emp.employmentStatus}</td>
                                    <td>
                                        {emp.hasAccount ? (
                                            <span className={styles.badge} style={{ background: 'var(--primary)', color: 'white' }}>
                                                Active
                                            </span>
                                        ) : emp.hasPendingInvite ? (
                                            <span className={styles.badge} style={{ background: 'var(--secondary)', color: '#000' }}>
                                                Invite Sent
                                            </span>
                                        ) : (
                                            <span className={styles.badge} style={{ background: '#ccc', color: '#666' }}>
                                                No Account
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            {!emp.hasAccount && (
                                                <InviteButton employeeId={emp.id} employeeName={emp.legalName} />
                                            )}
                                            <StatusToggleButton employeeId={emp.id} currentStatus={emp.employmentStatus} employeeName={emp.legalName} />
                                        </div>
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
