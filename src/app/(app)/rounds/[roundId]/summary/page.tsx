import Link from "next/link";
import { getPostRoundAnalysis } from "@/features/analysis/service";
import { PostRound } from "@/features/analysis/PostRound";
import { ForgetLocalRound } from "@/features/rounds/ForgetLocalRound";
import styles from "./summary.module.css";

export const metadata = { title: "Round summary" };

const SummaryPage = async ({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) => {
  const { roundId } = await params;
  const view = await getPostRoundAnalysis(roundId);

  return (
    <div className={styles.wrap}>
      <ForgetLocalRound roundId={roundId} />
      <div className={styles.topRow}>
        <Link href="/rounds" className={styles.back}>
          ← Your rounds
        </Link>
        {view.round.dataCompleteness === "coarse" ? (
          <Link href={`/rounds/${roundId}/edit`} className={styles.back}>
            Edit
          </Link>
        ) : null}
      </div>
      <PostRound view={view} />
    </div>
  );
};

export default SummaryPage;
