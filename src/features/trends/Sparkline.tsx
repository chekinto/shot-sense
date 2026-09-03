import type { TrendDirection } from "@/domain/scoring";
import styles from "./Sparkline.module.css";

interface SparklineProps {
  values: number[];
  /** Which way is good — colours the trend and the last point. */
  betterDirection: "up" | "down";
  direction: TrendDirection;
  label: string;
}

const W = 120;
const H = 32;
const PAD = 3;

/**
 * A tiny hand-rolled sparkline — no chart library. Themed through CSS vars so it
 * follows light / dark. Purely decorative; the numbers beside it carry the data.
 */
export const Sparkline = ({
  values,
  betterDirection,
  direction,
  label,
}: SparklineProps) => {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = (W - PAD * 2) / (values.length - 1);

  const points = values.map((value, i) => {
    const x = PAD + i * stepX;
    // Higher value = higher on screen when up is better; flip otherwise so the
    // line always rises when the golfer is improving.
    const norm = (value - min) / span;
    const up = betterDirection === "up" ? norm : 1 - norm;
    const y = PAD + (1 - up) * (H - PAD * 2);
    return [x, y] as const;
  });

  const tone =
    direction === "improving"
      ? styles.up
      : direction === "declining"
        ? styles.down
        : styles.flat;
  const [lastX, lastY] = points[points.length - 1]!;

  return (
    <svg
      className={`${styles.spark} ${tone}`}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={label}
      preserveAspectRatio="none"
    >
      <polyline
        className={styles.line}
        points={points.map(([x, y]) => `${x},${y}`).join(" ")}
      />
      <circle className={styles.dot} cx={lastX} cy={lastY} r={2.5} />
    </svg>
  );
};
