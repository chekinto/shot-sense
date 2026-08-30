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
      <Link href="/dashboard" className={styles.back}>
        ← Dashboard
      </Link>
      <PostRound view={view} />
    </div>
  );
};

export default SummaryPage;
