import Link from "next/link";
import styles from "./legal.module.css";

export default function LegalPage() {
    const awards = [
        {
            title: "Ordinary Hours",
            description: "Standard work hours are usually 38 hours per week, Monday to Friday (7 AM - 6 PM)."
        },
        {
            title: "Overtime (Weekdays)",
            description: "First 2 hours at 150%, then 200% thereafter."
        },
        {
            title: "Weekends & Public Holidays",
            description: "Saturdays: 150% (first 2h), 200% (after). Sundays: 200%. Public Holidays: 250%."
        },
        {
            title: "Night Shifts",
            description: "Activities between 8 PM and 6 AM carry a 15% loading for full-time employees."
        }
    ];

    return (
        <div className="container">
            <header className={styles.header}>
                <Link href="/admin" className={styles.backLink}>← Back to Admin</Link>
                <h1>Pastoral Award 2020</h1>
                <p>Current Australian Legal Standards for Farm Workers</p>
            </header>

            <section className={styles.content}>
                <div className="card">
                    <h2>Summary of Fair Work Regulations</h2>
                    <p>These rules are automatically applied by <strong>Rosi</strong> when calculating weekly payroll.</p>

                    <div className={styles.rulesList}>
                        {awards.map((award, index) => (
                            <div key={index} className={styles.ruleItem}>
                                <h4>{award.title}</h4>
                                <p>{award.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.importantNote}>
                    <p>⚠️ <strong>Note:</strong> Contractors may have different flat rates as per individual agreements, but they must still meet the 'Better Off Overall Test' (BOOT).</p>
                </div>
            </section>
        </div>
    );
}
