"use client";

import { useId } from "react";
import styles from "./SegmentedControl.module.css";

interface Option<T extends string | number> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T extends string | number> {
  label: string;
  /** Visually hide the label but keep it for assistive tech. */
  hideLabel?: boolean;
  options: ReadonlyArray<Option<T>>;
  value: T | null;
  onChange: (value: T) => void;
  disabled?: boolean;
  size?: "md" | "sm";
}

export const SegmentedControl = <T extends string | number>({
  label,
  hideLabel = false,
  options,
  value,
  onChange,
  disabled = false,
  size = "md",
}: SegmentedControlProps<T>) => {
  const groupId = useId();

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`${styles.group} ${size === "sm" ? styles.sm : ""}`}
    >
      {!hideLabel ? (
        <span id={groupId} className={styles.label}>
          {label}
        </span>
      ) : null}
      <div className={styles.segments}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={String(option.value)}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              className={`${styles.segment} ${selected ? styles.selected : ""}`}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
