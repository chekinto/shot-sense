import Link from "next/link";
import { getCoarseRoundForEdit } from "@/features/rounds/service";
import { BackfillForm } from "@/features/rounds/BackfillForm";
import styles from "../../rounds.module.css";

export const metadata = { title: "Edit round" };

const EditRoundPage = async ({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) => {
  const { roundId } = await params;
  const round = await getCoarseRoundForEdit(roundId);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Edit round</h1>
        <Link href={`/rounds/${roundId}/summary`} className={styles.action}>
          Cancel
        </Link>
      </header>
      <BackfillForm
        mode="edit"
        roundId={roundId}
        initialCourseName={round.courseName}
        initialPlayedOn={round.playedOn.toISOString().slice(0, 10)}
        initialHandicap={round.handicapAtStart}
        initialHoles={round.holes}
      />
    </div>
  );
};

export default EditRoundPage;
