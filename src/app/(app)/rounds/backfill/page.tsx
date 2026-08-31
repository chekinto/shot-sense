import Link from "next/link";
import { getOrCreateProfile } from "@/features/profile/service";
import { BackfillForm } from "@/features/rounds/BackfillForm";
import styles from "../rounds.module.css";

export const metadata = { title: "Add a past round" };

const BackfillPage = async () => {
  const profile = await getOrCreateProfile();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Add a past round</h1>
        <Link href="/rounds" className={styles.action}>
          Cancel
        </Link>
      </header>
      <p className={styles.empty}>
        Just the essentials per hole — score, shots to reach the zone, putts,
        penalties. Backfilled rounds feed your baseline and score trend, but not
        the tee / approach / mistake analysis.
      </p>
      <BackfillForm mode="create" initialHandicap={profile.handicap} />
    </div>
  );
};

export default BackfillPage;
