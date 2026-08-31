"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { activeRoundStore } from "@/infrastructure/offline/activeRoundStore";
import { flushRound, startBackgroundSync } from "@/infrastructure/offline/sync";
import type {
  CompleteHoleValues,
  HolePatch,
  PlayHole,
  PlayableRound,
} from "../types";
import { useOnlineStatus } from "./useOnlineStatus";

const FLUSH_DEBOUNCE_MS = 1200;

export interface PlayRoundController {
  round: PlayableRound;
  holes: Map<number, PlayHole>;
  currentHole: number;
  online: boolean;
  pendingSync: number;
  goToHole: (holeNumber: number) => void;
  patchCurrentHole: (patch: HolePatch) => void;
  completeHole: (
    holeNumber: number,
    values: CompleteHoleValues,
  ) => Promise<{ completedHoleCount: number }>;
  flush: () => Promise<void>;
}

export const usePlayRound = (
  initial: PlayableRound,
  startHole: number,
): PlayRoundController => {
  const online = useOnlineStatus();
  const [holes, setHoles] = useState<Map<number, PlayHole>>(
    () => new Map(initial.holes.map((h) => [h.holeNumber, h])),
  );
  const [currentHole, setCurrentHole] = useState(startHole);
  const [pendingSync, setPendingSync] = useState(0);

  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshPending = useCallback(async () => {
    setPendingSync(await activeRoundStore.pendingCount(initial.id));
  }, [initial.id]);

  const flush = useCallback(async () => {
    if (flushTimer.current) {
      clearTimeout(flushTimer.current);
      flushTimer.current = null;
    }
    await flushRound(initial.id);
    await refreshPending();
  }, [initial.id, refreshPending]);

  const scheduleFlush = useCallback(() => {
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(() => void flush(), FLUSH_DEBOUNCE_MS);
  }, [flush]);

  // Seed the local mirror from the server, then adopt any local-only edits.
  // The ref makes this run once even under StrictMode's double-invoke.
  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    void activeRoundStore.hydrate(initial).then((stored) => {
      setHoles(new Map(stored.holes.map((h) => [h.holeNumber, h])));
      // If the resume hole is already recorded locally (e.g. after an offline
      // reload), jump to the first hole that still needs recording.
      const firstIncomplete =
        stored.holes.find((h) => !h.isComplete)?.holeNumber ??
        stored.plannedHoleCount;
      setCurrentHole((current) =>
        stored.holes.find((h) => h.holeNumber === current)?.isComplete
          ? firstIncomplete
          : current,
      );
      void refreshPending();
    });
  }, [initial, refreshPending]);

  // Background sync while this screen is open.
  useEffect(() => startBackgroundSync(), []);

  const patchCurrentHole = useCallback(
    (patch: HolePatch) => {
      setHoles((prev) => {
        const existing = prev.get(currentHole);
        if (!existing) return prev;
        return new Map(prev).set(currentHole, { ...existing, ...patch });
      });
      void activeRoundStore
        .patchHole(initial.id, currentHole, patch)
        .then((hole) => {
          setHoles((prev) => new Map(prev).set(hole.holeNumber, hole));
          return refreshPending();
        });
      scheduleFlush();
    },
    [currentHole, initial.id, refreshPending, scheduleFlush],
  );

  const completeHole = useCallback(
    async (holeNumber: number, values: CompleteHoleValues) => {
      await activeRoundStore.patchHole(initial.id, holeNumber, values);
      const { completedHoleCount, hole } = await activeRoundStore.completeHole(
        initial.id,
        holeNumber,
      );
      setHoles((prev) => new Map(prev).set(holeNumber, hole));
      // The hole is saved locally — advance now, sync in the background. Finish
      // stays blocked until the queue drains (see FinishRound), so nothing is
      // lost by not awaiting the network here.
      void flush();
      return { completedHoleCount };
    },
    [initial.id, flush],
  );

  const goToHole = useCallback(
    (holeNumber: number) => {
      if (holeNumber === currentHole) return;
      void flush();
      setCurrentHole(holeNumber);
    },
    [currentHole, flush],
  );

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      void flush();
    };
  }, [flush]);

  return {
    round: initial,
    holes,
    currentHole,
    online,
    pendingSync,
    goToHole,
    patchCurrentHole,
    completeHole,
    flush,
  };
};
