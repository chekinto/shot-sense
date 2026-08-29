import Link from "next/link";
import styles from "../auth.module.css";

export const metadata = { title: "Confirm your email" };

const CheckEmailPage = () => (
  <>
    <div className={styles.heading}>
      <h1>Confirm your email</h1>
      <p>
        We&rsquo;ve sent you a confirmation link. Open it to finish setting up your
        account, then log in.
      </p>
    </div>
    <p className={styles.alt}>
      <Link href="/login">Back to log in</Link>
    </p>
  </>
);

export default CheckEmailPage;
