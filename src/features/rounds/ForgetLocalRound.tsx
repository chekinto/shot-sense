"use client";

import { useEffect } from "react";
import { activeRoundStore } from "@/infrastructure/offline/activeRoundStore";

/**
 * Drops the on-device mirror for a round once its summary is being viewed — by
 * then it's finished server-side, so keeping the local copy would only make it
 * reappear as "resume offline" on the dashboard.
 */
export const ForgetLocalRound = ({ roundId }: { roundId: string }) => {
  useEffect(() => {
    void activeRoundStore.forget(roundId);
  }, [roundId]);
  return null;
};
