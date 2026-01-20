import { auth } from "@/auth";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import LogoutButton from "./components/LogoutButton";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  // @ts-ignore
  const role = session?.user?.role;

  if (isLoggedIn) {
    redirect(role === 'admin' ? '/admin' : '/employee');
  }

  return (
    <main className="container">
      <section className={styles.hero}>
        <div className={styles.logoWrapper}>
          <Image
            src="/brand/logo.png"
            alt="Budgalong Logo"
            width={180}
            height={180}
            priority
            className={styles.logo}
          />
        </div>
        <h1 className={styles.title}>Budgalong</h1>
        <p className={styles.subtitle}>
          Smart Management & Payroll for <strong>Budgalong</strong>.
          <br />How would you like to log in today?
        </p>

        <div className={styles.actions}>
          <Link href="/admin/login" className="btn btn-primary" style={{ width: '220px' }}>
            I'm an Admin
          </Link>
          <Link href="/login/employee" className="btn btn-secondary" style={{ width: '220px' }}>
            I'm an Employee
          </Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>© 2026 Budgalong - Desarrollado by Santiago Buffa</p>
      </footer>
    </main>
  );
}
