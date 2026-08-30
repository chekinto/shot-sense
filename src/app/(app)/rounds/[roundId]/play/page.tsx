import Link from "next/link";
import { redirect } from "next/navigation";
import { getPlayableRound } from "@/features/rounds/service";
import { PlayRound } from "@/features/rounds/play/PlayRound";
import styles from "./play.module.css";

export const metadata = { title: "Play" };

const PlayRoundPage = async ({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) => {
  const { roundId } = await params;
  const round = await getPlayableRound(roundId);

  if (round.status === "completed" || round.status === "abandoned") {
    redirect(`/rounds/${roundId}/summary`);
  }

  const firstIncomplete = round.holes.find((h) => !h.isComplete)?.holeNumber;
  const startHole = firstIncomplete ?? round.plannedHoleCount;

  return (
    <div className={styles.wrap}>
      <Link href="/dashboard" className={styles.back}>
        ← Dashboard
      </Link>
      <PlayRound round={round} startHole={startHole} />
    </div>
  );
};

export default PlayRoundPage;
