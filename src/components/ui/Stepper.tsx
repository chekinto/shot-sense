"use client";

import { useId } from "react";
import styles from "./Stepper.module.css";

interface StepperProps {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Text shown in place of the value when `value` is null. */
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
}

export const Stepper = ({
  label,
  value,
  onChange,
  min = 0,
  max = 20,
  placeholder = "—",
  hint,
  disabled = false,
}: StepperProps) => {
  const hintId = useId();
  const current = value ?? min;
  const atMin = value !== null && current <= min;
  const atMax = value !== null && current >= max;

  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <span className={styles.label}>{label}</span>
      </div>
      <div
        className={styles.control}
        role="group"
        aria-label={label}
        aria-describedby={hint ? hintId : undefined}
      >
        <button
          type="button"
          className={styles.button}
          aria-label={`Decrease ${label}`}
          disabled={disabled || atMin}
          onClick={() => onChange(Math.max(min, current - 1))}
        >
          −
        </button>
        <output className={styles.value}>
          {value === null ? placeholder : value}
        </output>
        <button
          type="button"
          className={styles.button}
          aria-label={`Increase ${label}`}
          disabled={disabled || atMax}
          onClick={() => onChange(value === null ? min : Math.min(max, current + 1))}
        >
          +
        </button>
      </div>
      {hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
};
