import type { ReactNode } from "react";
import Link from "next/link";
import { getOrCreateProfile } from "@/features/profile/service";
import { signOut } from "@/features/auth/actions";
import styles from "./layout.module.css";

// Everything behind auth is per-request; never attempt static generation.
export const dynamic = "force-dynamic";

const AppLayout = async ({ children }: { children: ReactNode }) => {
  // Guards auth (redirects to /login if signed out) and ensures a profile row.
  await getOrCreateProfile();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/dashboard" className={styles.brand}>
          Shot Sense
        </Link>
        <nav className={styles.nav}>
          <Link href="/courses" className={styles.navLink}>
            Courses
          </Link>
          <form action={signOut}>
            <button type="submit" className={styles.signOut}>
              Sign out
            </button>
          </form>
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
};

export default AppLayout;
