import Link from "next/link";
import { SignupForm } from "./SignupForm";
import styles from "../auth.module.css";

export const metadata = { title: "Create account" };

const SignupPage = () => (
  <>
    <div className={styles.heading}>
      <h1>Create your account</h1>
      <p>Start understanding where your score is really going.</p>
    </div>
    <SignupForm />
    <p className={styles.alt}>
      Already have an account? <Link href="/login">Log in</Link>
    </p>
  </>
);

export default SignupPage;
