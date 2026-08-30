"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { activeRoundStore } from "@/infrastructure/offline/activeRoundStore";
import type { StoredActiveRound } from "@/infrastructure/offline/db";
import { useOnlineStatus } from "./play/useOnlineStatus";
import styles from "./LocalResumeCard.module.css";

/**
 * Offline fallback for the dashboard's "Resume round" card. When online the
 * server-rendered card is authoritative; this only shows a locally-mirrored
 * round when there's no connection.
 */
export const LocalResumeCard = () => {
  const online = useOnlineStatus();
  const [round, setRound] = useState<StoredActiveRound | null>(null);

  useEffect(() => {
    void activeRoundStore.listResumable().then((rounds) => setRound(rounds[0] ?? null));
  }, []);

  if (online || !round) return null;

  const resumeHole =
    round.holes.find((h) => !h.isComplete)?.holeNumber ?? round.plannedHoleCount;

  return (
    <section className={styles.card}>
      <h2>Resume round (offline)</h2>
      <p>
        {round.courseName}
        {round.teeName ? ` · ${round.teeName}` : ""} — hole {resumeHole} of{" "}
        {round.plannedHoleCount}
      </p>
      <Link href={`/rounds/${round.id}/play`} className={styles.cta}>
        Resume
      </Link>
    </section>
  );
};
