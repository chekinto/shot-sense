"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveHole } from "../recordActions";
import type { HolePatch, PlayHole, PlayableRound } from "../types";

const DEBOUNCE_MS = 700;

export type SaveState = "idle" | "saving" | "saved" | "error";

export interface PlayRoundController {
  round: PlayableRound;
  holes: Map<number, PlayHole>;
  currentHole: number;
  saveState: SaveState;
  goToHole: (holeNumber: number) => void;
  patchCurrentHole: (patch: HolePatch) => void;
  /** Force any queued autosave to persist now. */
  flush: () => Promise<void>;
  setHoleLocally: (hole: PlayHole) => void;
}

export const usePlayRound = (
  initial: PlayableRound,
  startHole: number,
): PlayRoundController => {
  const [holes, setHoles] = useState<Map<number, PlayHole>>(
    () => new Map(initial.holes.map((h) => [h.holeNumber, h])),
  );
  const [currentHole, setCurrentHole] = useState(startHole);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  // Accumulated unsaved patch for a single hole.
  const queued = useRef<{ holeNumber: number; patch: HolePatch } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const job = queued.current;
    if (!job) return;
    queued.current = null;

    setSaveState("saving");
    const result = await saveHole({
      roundId: initial.id,
      holeNumber: job.holeNumber,
      patch: job.patch,
    });
    if (result.ok) {
      setHoles((prev) => new Map(prev).set(job.holeNumber, result.hole));
      setSaveState("saved");
    } else {
      setSaveState("error");
    }
  }, [initial.id]);

  const patchCurrentHole = useCallback(
    (patch: HolePatch) => {
      setHoles((prev) => {
        const existing = prev.get(currentHole);
        if (!existing) return prev;
        return new Map(prev).set(currentHole, { ...existing, ...patch });
      });

      const job = queued.current;
      queued.current = {
        holeNumber: currentHole,
        patch:
          job && job.holeNumber === currentHole
            ? { ...job.patch, ...patch }
            : patch,
      };

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
    },
    [currentHole, flush],
  );

  const goToHole = useCallback(
    (holeNumber: number) => {
      if (holeNumber === currentHole) return;
      void flush();
      setCurrentHole(holeNumber);
    },
    [currentHole, flush],
  );

  const setHoleLocally = useCallback((hole: PlayHole) => {
    setHoles((prev) => new Map(prev).set(hole.holeNumber, hole));
  }, []);

  // Persist anything queued when the tab is hidden or the component unmounts.
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
    saveState,
    goToHole,
    patchCurrentHole,
    flush,
    setHoleLocally,
  };
};
