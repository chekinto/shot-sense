import Link from "next/link";
import { getOrCreateProfile } from "@/features/profile/service";
import { hasCompletedOnboarding } from "@/features/profile/types";
import styles from "./page.module.css";

export const metadata = { title: "Dashboard" };

const DashboardPage = async () => {
  const profile = await getOrCreateProfile();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Your game</h1>

      {!hasCompletedOnboarding(profile) ? (
        <section className={styles.card}>
          <h2>Finish setting up</h2>
          <p>Add your handicap so your analysis has context.</p>
          <Link href="/onboarding" className={styles.cta}>
            Add handicap
          </Link>
        </section>
      ) : (
        <section className={styles.card}>
          <h2>Handicap {profile.handicap}</h2>
          <p>Round recording arrives in the next slice.</p>
        </section>
      )}
    </div>
  );
};

export default DashboardPage;
