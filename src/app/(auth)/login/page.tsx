import Link from "next/link";
import { LoginForm } from "./LoginForm";
import styles from "../auth.module.css";

export const metadata = { title: "Log in" };

const LoginPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) => {
  const { next } = await searchParams;
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : undefined;

  return (
    <>
      <div className={styles.heading}>
        <h1>Log in</h1>
        <p>Welcome back.</p>
      </div>
      <LoginForm next={safeNext} />
      <p className={styles.alt}>
        New here? <Link href="/signup">Create an account</Link>
      </p>
    </>
  );
};

export default LoginPage;
