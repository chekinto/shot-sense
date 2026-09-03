import Link from "next/link";
import { Card } from "@/components/ui";
import { GAME_TREND_MIN_ROUNDS } from "@/domain/scoring";
import { getGameTrend } from "@/features/trends/service";
import { GameTrendView } from "@/features/trends/GameTrendView";
import styles from "./trends.module.css";

export const metadata = { title: "Your trends" };

const TrendsPage = async () => {
  const { trend, completedRoundCount } = await getGameTrend();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Your trends</h1>
        <Link href="/rounds" className={styles.back}>
          Your rounds
        </Link>
      </header>

      {trend ? (
        <GameTrendView trend={trend} />
      ) : (
        <Card>
          <p className={styles.empty}>
            {completedRoundCount === 0
              ? "Play a round — or add older ones — and your trends build from there."
              : `Trends need at least ${GAME_TREND_MIN_ROUNDS} completed rounds. You have ${completedRoundCount}.`}
          </p>
          <Link href="/rounds/backfill" className={styles.cta}>
            Add a past round
          </Link>
        </Card>
      )}
    </div>
  );
};

export default TrendsPage;
