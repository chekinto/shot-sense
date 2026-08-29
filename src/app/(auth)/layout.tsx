import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./layout.module.css";

const AuthLayout = ({ children }: { children: ReactNode }) => (
  <main className={styles.main}>
    <div className={styles.card}>
      <Link href="/" className={styles.brand}>
        Shot Sense
      </Link>
      {children}
    </div>
  </main>
);

export default AuthLayout;
