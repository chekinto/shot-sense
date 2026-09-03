import { Card } from "@/components/ui";
import type { GameTrend, MetricSeries } from "@/domain/scoring";
import { Sparkline } from "./Sparkline";
import { categoryLabel } from "@/features/analysis/format";
import styles from "./GameTrendView.module.css";

const DIRECTION_WORD: Record<string, string> = {
  improving: "improving",
  declining: "slipping",
  steady: "steady",
};

const pct = (v: number): string => `${Math.round(v * 100)}%`;
const perHole = (v: number): string =>
  `${v > 0 ? "+" : ""}${(Math.round(v * 10) / 10).toFixed(1)}/hole`;

const BAND_LABELS: Record<string, string> = {
  "under-100": "Inside 100 yds",
  "100-124": "100–124 yds",
  "125-149": "125–149 yds",
  "150-174": "150–174 yds",
  "175-199": "175–199 yds",
  "200-plus": "200+ yds",
};

interface MetricRowProps {
  label: string;
  series: MetricSeries;
  better: "up" | "down";
  format: (v: number) => string;
}

const MetricRow = ({ label, series, better, format }: MetricRowProps) => {
  const latest = series.values[series.values.length - 1];
  return (
    <div className={styles.metric}>
      <div className={styles.metricHead}>
        <span className={styles.metricLabel}>{label}</span>
        <span className={styles.metricValue}>
          {latest === undefined ? "—" : format(latest)}
          {series.direction && series.direction !== "steady" ? (
            <span className={styles.metricDir}>
              {" "}
              · {DIRECTION_WORD[series.direction]}
            </span>
          ) : null}
        </span>
      </div>
      <Sparkline
        values={series.values}
        betterDirection={better}
        direction={series.direction}
        label={`${label} over your last ${series.values.length} rounds`}
      />
    </div>
  );
};

export const GameTrendView = ({ trend }: { trend: GameTrend }) => (
  <div className={styles.wrap}>
    <Card>
      <h2 className={styles.title}>Against the benchmark</h2>
      <p className={styles.sub}>
        Your last {trend.roundCount} rounds, across different courses.
      </p>
      <MetricRow
        label="Entered in regulation"
        series={trend.enteredInRegulation}
        better="up"
        format={pct}
      />
      <MetricRow
        label="Got down in three"
        series={trend.downInThree}
        better="up"
        format={pct}
      />
      <MetricRow
        label="Score to par"
        series={trend.scoreToPar}
        better="down"
        format={perHole}
      />
      <MetricRow
        label="Shots to get back"
        series={trend.shotsToGetBack}
        better="down"
        format={perHole}
      />
    </Card>

    <Card>
      <h2 className={styles.title}>Approach play by distance</h2>
      {trend.approachBandsUnlocked && trend.approachBands.length > 0 ? (
        <ul className={styles.bands}>
          {trend.approachBands.map((band) => (
            <li key={band.band} className={styles.band}>
              <span>{BAND_LABELS[band.band] ?? band.band}</span>
              <span className={styles.bandValue}>
                {Math.round(band.successRate * 100)}% found the zone
                <span className={styles.bandAttempts}> ({band.attempts})</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.sub}>
          Not enough approach data yet — band-level patterns unlock after about
          15 rounds ({trend.approachAttempts} approach
          {trend.approachAttempts === 1 ? "" : "es"} logged so far).
        </p>
      )}
    </Card>

    {trend.recurringLeaks.length > 0 ? (
      <Card>
        <h2 className={styles.title}>What keeps coming up</h2>
        <ul className={styles.leaks}>
          {trend.recurringLeaks.map((leak) => (
            <li key={leak.category}>
              <strong>{categoryLabel(leak.category)}</strong> — a top-two leak in{" "}
              {leak.rounds} of your last {trend.roundCount} rounds
            </li>
          ))}
        </ul>
      </Card>
    ) : null}
  </div>
);
