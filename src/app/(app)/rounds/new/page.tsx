import Link from "next/link";
import { Card } from "@/components/ui";
import { getOrCreateProfile } from "@/features/profile/service";
import {
  getActiveRound,
  getStartRoundOptions,
} from "@/features/rounds/service";
import { StartRoundForm } from "@/features/rounds/StartRoundForm";
import styles from "./new.module.css";

export const metadata = { title: "Start a round" };

const NewRoundPage = async () => {
  const [courses, profile, active] = await Promise.all([
    getStartRoundOptions(),
    getOrCreateProfile(),
    getActiveRound(),
  ]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Start a round</h1>
        <Link href="/dashboard" className={styles.cancel}>
          Cancel
        </Link>
      </header>

      {active ? (
        <Card>
          <p className={styles.resume}>
            You have a round in progress at {active.courseName}.{" "}
            <Link href={`/rounds/${active.id}/play`}>Resume it</Link>
          </p>
        </Card>
      ) : null}

      {courses.length === 0 ? (
        <Card>
          <p className={styles.empty}>
            Add a course first, then you can start a round on it.
          </p>
          <Link href="/courses/new" className={styles.addCourse}>
            Add course
          </Link>
        </Card>
      ) : (
        <StartRoundForm courses={courses} defaultHandicap={profile.handicap} />
      )}
    </div>
  );
};

export default NewRoundPage;
