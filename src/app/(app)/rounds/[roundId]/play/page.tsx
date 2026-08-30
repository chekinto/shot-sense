import Link from "next/link";
import { getPlayableRound } from "@/features/rounds/service";
import styles from "./play.module.css";

export const metadata = { title: "Play" };

const PlayRoundPage = async ({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) => {
  const { roundId } = await params;
  const round = await getPlayableRound(roundId);

  const outPar = round.holes
    .filter((h) => h.holeNumber <= 9)
    .reduce((s, h) => s + h.par, 0);
  const totalPar = round.holes.reduce((s, h) => s + h.par, 0);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{round.courseName}</h1>
          <p className={styles.meta}>
            {round.teeName ? `${round.teeName} tees · ` : ""}
            {round.plannedHoleCount} holes · par {totalPar}
            {round.handicapAtStart !== null
              ? ` · hcp ${round.handicapAtStart}`
              : ""}
          </p>
        </div>
        <Link href="/dashboard" className={styles.back}>
          Dashboard
        </Link>
      </header>

      <p className={styles.notice}>
        Hole-by-hole recording arrives in the next update. Your round is saved and
        will resume here.
      </p>

      <ol className={styles.holes}>
        {round.holes.map((hole) => (
          <li key={hole.holeNumber} className={styles.hole}>
            <span className={styles.holeNo}>{hole.holeNumber}</span>
            <span className={styles.holePar}>Par {hole.par}</span>
            <span className={styles.holeYd}>
              {hole.yardage !== null ? `${hole.yardage} yd` : "—"}
            </span>
          </li>
        ))}
      </ol>

      <p className={styles.footNote}>Front nine par {outPar}.</p>
    </div>
  );
};

export default PlayRoundPage;
