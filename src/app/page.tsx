import { auth } from "@/auth";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import LogoutButton from "./components/LogoutButton";

export default async function Home() {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  // @ts-ignore
  const role = session?.user?.role;
  const dashboardLink = role === 'admin' ? '/admin' : '/employee';

  return (
    <main className="container">
      <section className={styles.hero}>
        <div className={styles.logoWrapper}>
          <Image
            src="/logo.png"
            alt="Rosi Logo"
            width={220}
            height={220}
            priority
            className={styles.logo}
          />
        </div>
        <h1 className={styles.title}>Hi! I'm Rosi</h1>
        <p className={styles.subtitle}>
          Welcome to the smart management of <strong>Budgalon Farm</strong>.
          {isLoggedIn ? ` You are logged in as ${session.user?.name}.` : " How would you like to log in today?"}
        </p>

        <div className={styles.actions}>
          {isLoggedIn ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', alignItems: 'center' }}>
              <Link href={dashboardLink} className="btn btn-primary" style={{ width: '200px' }}>
                Go to Dashboard
              </Link>
              <div style={{ transform: 'scale(0.9)' }}>
                <LogoutButton />
              </div>
            </div>
          ) : (
            <>
              <Link href="/admin/login" className="btn btn-primary">
                I'm an Admin
              </Link>
              <Link href="/login" className="btn btn-secondary">
                I'm an Employee
              </Link>
            </>
          )}
        </div>
      </section>

      <footer className={styles.footer}>
        <p>© 2026 Rosi Farm Management - Built for Budgalon</p>
      </footer>
    </main>
  );
}
