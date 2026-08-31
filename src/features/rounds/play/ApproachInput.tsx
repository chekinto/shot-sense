"use client";

import { SegmentedControl } from "@/components/ui";
import {
  APPROACH_DISTANCE_BANDS,
  APPROACH_RESULTS,
  MISS_DIRECTIONS,
  type ApproachDistanceBand,
  type ApproachResult,
  type MissDirection,
} from "@/domain/scoring";
import type { PlayApproach } from "../types";
import styles from "./ApproachInput.module.css";

const BAND_LABELS: Record<ApproachDistanceBand, string> = {
  "under-100": "<100",
  "100-124": "100–124",
  "125-149": "125–149",
  "150-174": "150–174",
  "175-199": "175–199",
  "200-plus": "200+",
};

const RESULT_LABELS: Record<ApproachResult, string> = {
  green: "Green",
  "scoring-zone": "Zone",
  "missed-zone": "Missed",
  "intentional-layup": "Lay-up",
};

const MISS_LABELS: Record<MissDirection, string> = {
  short: "Short",
  long: "Long",
  left: "Left",
  right: "Right",
};

const resequence = (approaches: PlayApproach[]): PlayApproach[] =>
  approaches.map((approach, index) => ({ ...approach, sequence: index + 1 }));

interface ApproachInputProps {
  approaches: PlayApproach[];
  onChange: (approaches: PlayApproach[]) => void;
}

/**
 * §32–35 — the hole's approach attempts (shots from outside the zone aiming at
 * the green/zone). Distance band is always picked by hand; miss direction only
 * appears for a `missed-zone` result and is required before the hole can be
 * completed (the domain validator enforces that).
 */
export const ApproachInput = ({ approaches, onChange }: ApproachInputProps) => {
  const update = (index: number, patch: Partial<PlayApproach>) => {
    onChange(
      resequence(
        approaches.map((approach, i) =>
          i === index ? { ...approach, ...patch } : approach,
        ),
      ),
    );
  };

  const remove = (index: number) => {
    onChange(resequence(approaches.filter((_, i) => i !== index)));
  };

  const add = () => {
    onChange(
      resequence([
        ...approaches,
        {
          sequence: approaches.length + 1,
          distanceBand: "150-174",
          result: "green",
          missDirection: null,
        },
      ]),
    );
  };

  return (
    <div className={styles.wrap}>
      {approaches.map((approach, index) => (
        <div key={approach.sequence} className={styles.row}>
          <div className={styles.rowHead}>
            <span className={styles.rowLabel}>Approach {index + 1}</span>
            <button
              type="button"
              className={styles.remove}
              onClick={() => remove(index)}
              aria-label={`Remove approach ${index + 1}`}
            >
              Remove
            </button>
          </div>

          <SegmentedControl<ApproachDistanceBand>
            label={`Approach ${index + 1} distance (yds)`}
            hideLabel
            options={APPROACH_DISTANCE_BANDS.map((band) => ({
              label: BAND_LABELS[band],
              value: band,
            }))}
            value={approach.distanceBand}
            onChange={(distanceBand) => update(index, { distanceBand })}
            size="sm"
          />

          <SegmentedControl<ApproachResult>
            label={`Approach ${index + 1} result`}
            hideLabel
            options={APPROACH_RESULTS.map((result) => ({
              label: RESULT_LABELS[result],
              value: result,
            }))}
            value={approach.result}
            onChange={(result) =>
              update(index, {
                result,
                missDirection:
                  result === "missed-zone" ? approach.missDirection : null,
              })
            }
            size="sm"
          />

          {approach.result === "missed-zone" ? (
            <SegmentedControl<MissDirection>
              label={`Approach ${index + 1} miss direction`}
              hideLabel
              options={MISS_DIRECTIONS.map((direction) => ({
                label: MISS_LABELS[direction],
                value: direction,
              }))}
              value={approach.missDirection}
              onChange={(missDirection) => update(index, { missDirection })}
              size="sm"
            />
          ) : null}
        </div>
      ))}

      <button type="button" className={styles.add} onClick={add}>
        + Add {approaches.length > 0 ? "another approach" : "approach"}
      </button>
    </div>
  );
};
