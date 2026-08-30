import { Card } from "@/components/ui";
import type { SectionSummary } from "@/domain/scoring";
import type { PostRoundView } from "./types";
import { resultBreakdown, toParLabel } from "./format";
import styles from "./PostRound.module.css";

const SectionRow = ({
  label,
  section,
}: {
  label: string;
  section: SectionSummary;
}) => (
  <div className={styles.sectionRow}>
    <div className={styles.sectionHead}>
      <span className={styles.sectionLabel}>{label}</span>
      <span className={styles.sectionScore}>
        {section.score}{" "}
        <span className={styles.sectionToPar}>
          ({toParLabel(section.toPar)})
        </span>
      </span>
    </div>
    {resultBreakdown(section.results) ? (
      <p className={styles.breakdown}>{resultBreakdown(section.results)}</p>
    ) : null}
  </div>
);

export const PostRound = ({ view }: { view: PostRoundView }) => {
  const { round, analysis, comparison, completedRoundCount } = view;
  const { summary, benchmark, shotsToGetBack, observations } = analysis;

  const longLagThreePutts = observations.some(
    (o) => o.id === "three-putts" && /long range/i.test(o.text),
  );
  const yourGameRoundsNeeded = Math.max(0, 5 - completedRoundCount);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.course}>
          {round.courseName}
          {round.teeName ? ` · ${round.teeName}` : ""} ·{" "}
          {round.playedOn.toLocaleDateString()}
        </p>
        <div className={styles.headline}>
          <span className={styles.score}>{summary.overall.score}</span>
          <span className={styles.toPar}>
            {toParLabel(summary.overall.toPar)} · par {summary.overall.par} ·{" "}
            {round.holesPlayed} holes
          </span>
        </div>
      </header>

      <Card>
        <h2 className={styles.cardTitle}>The round</h2>
        {summary.front && summary.back ? (
          <>
            <SectionRow label="Front 9" section={summary.front} />
            <SectionRow label="Back 9" section={summary.back} />
            <SectionRow label="Overall" section={summary.overall} />
          </>
        ) : (
          <SectionRow label={`Played ${round.holesPlayed}`} section={summary.overall} />
        )}
      </Card>

      <Card>
        <h2 className={styles.cardTitle}>Against the benchmark</h2>
        <p className={styles.benchmarkNote}>
          Enter the scoring zone in regulation and get down in three on every
          hole and you never make a double.
        </p>
        <div className={styles.benchmarkGrid}>
          <div>
            <span className={styles.bigStat}>
              {benchmark.enteredInRegulation.count}
              <span className={styles.ofStat}>
                /{benchmark.enteredInRegulation.of}
              </span>
            </span>
            <span className={styles.statLabel}>entered in regulation</span>
            {comparison ? (
              <span className={styles.compare}>
                last round {comparison.enteredInRegulation.count}/
                {comparison.enteredInRegulation.of}
              </span>
            ) : null}
          </div>
          <div>
            <span className={styles.bigStat}>
              {benchmark.downInThree.count}
              <span className={styles.ofStat}>/{benchmark.downInThree.of}</span>
            </span>
            <span className={styles.statLabel}>got down in three</span>
            {comparison ? (
              <span className={styles.compare}>
                last round {comparison.downInThree.count}/
                {comparison.downInThree.of}
              </span>
            ) : null}
          </div>
        </div>

        {benchmark.leakHoles.length > 0 ? (
          <div className={styles.leaks}>
            <p className={styles.leaksTitle}>
              Where shots leaked ({benchmark.totalToZoneLeak} getting to the
              zone, {benchmark.totalFromZoneLeak} finishing)
            </p>
            <ul className={styles.leakList}>
              {benchmark.leakHoles.map((h) => (
                <li key={h.holeNumber} className={styles.leakRow}>
                  <span className={styles.leakHole}>Hole {h.holeNumber}</span>
                  <span className={styles.leakDetail}>
                    {h.toZoneLeak > 0
                      ? `+${h.toZoneLeak} to zone`
                      : null}
                    {h.toZoneLeak > 0 && h.fromZoneLeak > 0 ? " · " : null}
                    {h.fromZoneLeak > 0
                      ? `+${h.fromZoneLeak} finishing`
                      : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className={styles.clean}>Every hole met the benchmark. Rare — nice.</p>
        )}
      </Card>

      <Card>
        <h2 className={styles.cardTitle}>Shots to get back</h2>
        <p className={styles.stgbTotal}>{shotsToGetBack.total}</p>
        <p className={styles.stgbBreakdown}>
          {shotsToGetBack.penalty} penalty · {shotsToGetBack.putting} putting ·{" "}
          {shotsToGetBack.bunker} bunker
        </p>
        <p className={styles.stgbNote}>
          Clear, conservative opportunities — penalty strokes, putts above two,
          repeated bunker shots. Not a claim they&rsquo;d all vanish at once.
          {longLagThreePutts
            ? " Long-range 3-putts count here but are far from certain giveaways."
            : ""}
        </p>
      </Card>

      {observations.length > 0 ? (
        <Card>
          <h2 className={styles.cardTitle}>This round</h2>
          <ul className={styles.observations}>
            {observations.map((o) => (
              <li key={o.id}>{o.text}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card>
        <h2 className={styles.cardTitle}>Your game</h2>
        <p className={styles.locked}>
          {yourGameRoundsNeeded > 0
            ? `Recurring patterns and your Primary / Secondary focus unlock after about 5 rounds — ${yourGameRoundsNeeded} to go.`
            : "Trend analysis is coming in a future update."}
        </p>
      </Card>
    </div>
  );
};
