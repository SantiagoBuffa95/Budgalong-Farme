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
          <Link href="/login" className="btn btn-primary" style={{ width: '220px', padding: '1rem', fontSize: '1.2rem' }}>
            Login to Portal
          </Link>
          <Link href="/assistants" className="btn btn-assistants" style={{ width: '220px', padding: '1rem', fontSize: '1.2rem' }}>
            GPT Assistants
          </Link>
        </div>
      </section>

      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', width: '100%', maxWidth: '800px', margin: '2rem auto' }}>
        <Link href="/demo" className="btn btn-demo">
          Try Demo (No Login) →
        </Link>
      </div>

      <footer className={styles.footer}>
        <p>© 2026 Budgalong - Desarrollado by Santiago Buffa</p>
      </footer>
    </main >
  );
}
