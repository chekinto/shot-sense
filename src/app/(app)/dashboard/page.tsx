import Link from "next/link";
import { getOrCreateProfile } from "@/features/profile/service";
import { hasCompletedOnboarding } from "@/features/profile/types";
import { getActiveRound } from "@/features/rounds/service";
import { LocalResumeCard } from "@/features/rounds/LocalResumeCard";
import styles from "./page.module.css";

export const metadata = { title: "Dashboard" };

const DashboardPage = async () => {
  const [profile, activeRound] = await Promise.all([
    getOrCreateProfile(),
    getActiveRound(),
  ]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Your game</h1>

      <LocalResumeCard />

      {!hasCompletedOnboarding(profile) ? (
        <section className={styles.card}>
          <h2>Finish setting up</h2>
          <p>Add your handicap so your analysis has context.</p>
          <Link href="/onboarding" className={styles.cta}>
            Add handicap
          </Link>
        </section>
      ) : null}

      {activeRound ? (
        <section className={styles.card}>
          <h2>Resume round</h2>
          <p>
            {activeRound.courseName}
            {activeRound.teeName ? ` · ${activeRound.teeName}` : ""} — hole{" "}
            {activeRound.resumeHoleNumber} of {activeRound.plannedHoleCount}
          </p>
          <Link href={`/rounds/${activeRound.id}/play`} className={styles.cta}>
            Resume
          </Link>
        </section>
      ) : (
        <section className={styles.card}>
          <h2>Start a round</h2>
          <p>Pick a course and record your round as you play.</p>
          <Link href="/rounds/new" className={styles.cta}>
            Start round
          </Link>
        </section>
      )}

      <section className={styles.card}>
        <h2>Your rounds</h2>
        <p>
          Review past rounds, or add older ones so your baseline has something to
          compare against.
        </p>
        <Link href="/rounds" className={styles.cta}>
          View rounds
        </Link>
      </section>
    </div>
  );
};

export default DashboardPage;
