import Link from "next/link";
import { Card } from "@/components/ui";
import { getRoundHistory } from "@/features/rounds/service";
import { deleteCompletedRound } from "@/features/rounds/backfillActions";
import styles from "./rounds.module.css";

export const metadata = { title: "Your rounds" };

const toPar = (n: number): string => (n === 0 ? "E" : n > 0 ? `+${n}` : `${n}`);

const RoundsPage = async () => {
  const rounds = await getRoundHistory();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Your rounds</h1>
        <Link href="/rounds/backfill" className={styles.add}>
          Add past round
        </Link>
      </header>

      {rounds.length === 0 ? (
        <Card>
          <p className={styles.empty}>
            No completed rounds yet. Play one, or add older rounds so your
            baseline has something to compare against.
          </p>
        </Card>
      ) : (
        <ul className={styles.list}>
          {rounds.map((round) => (
            <li key={round.id}>
              <Card>
                <div className={styles.row}>
                  <Link
                    href={`/rounds/${round.id}/summary`}
                    className={styles.rowLink}
                  >
                    <span className={styles.name}>
                      {round.courseName}
                      {round.dataCompleteness === "coarse" ? (
                        <span className={styles.badge}>backfilled</span>
                      ) : null}
                    </span>
                    <span className={styles.meta}>
                      {round.playedOn.toLocaleDateString()} · {round.holesPlayed}{" "}
                      holes · {round.score} ({toPar(round.toPar)})
                    </span>
                  </Link>
                  <div className={styles.actions}>
                    {round.dataCompleteness === "coarse" ? (
                      <Link
                        href={`/rounds/${round.id}/edit`}
                        className={styles.action}
                      >
                        Edit
                      </Link>
                    ) : null}
                    <form action={deleteCompletedRound}>
                      <input type="hidden" name="roundId" value={round.id} />
                      <button type="submit" className={styles.delete}>
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RoundsPage;
