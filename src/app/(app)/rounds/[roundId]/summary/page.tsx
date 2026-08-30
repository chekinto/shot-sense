import Link from "next/link";
import { Card } from "@/components/ui";
import { getPlayableRound } from "@/features/rounds/service";
import styles from "./summary.module.css";

export const metadata = { title: "Round summary" };

const SummaryPage = async ({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) => {
  const { roundId } = await params;
  const round = await getPlayableRound(roundId);

  const played = round.holes.filter((h) => h.isComplete && h.score !== null);
  const score = played.reduce((sum, h) => sum + (h.score ?? 0), 0);
  const par = played.reduce((sum, h) => sum + h.par, 0);
  const toPar = score - par;

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.title}>{round.courseName}</h1>
        <p className={styles.meta}>
          {round.teeName ? `${round.teeName} · ` : ""}
          {played.length} holes played
        </p>
      </header>

      <Card>
        <div className={styles.score}>
          <span className={styles.big}>{score}</span>
          <span className={styles.par}>
            {toPar === 0 ? "level par" : toPar > 0 ? `+${toPar}` : `${toPar}`} ·
            par {par}
          </span>
        </div>
      </Card>

      <Card>
        <p className={styles.next}>
          Shots to Get Back, the benchmark scorecard and your category breakdown
          arrive in the next update.
        </p>
      </Card>

      <Link href="/dashboard" className={styles.back}>
        Back to dashboard
      </Link>
    </div>
  );
};

export default SummaryPage;
