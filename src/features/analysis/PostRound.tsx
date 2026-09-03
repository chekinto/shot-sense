import Link from "next/link";
import { Card } from "@/components/ui";
import {
  GAME_TREND_MIN_ROUNDS,
  RECOMMENDATION_MIN_ROUNDS,
  type SectionSummary,
} from "@/domain/scoring";
import type { PostRoundView } from "./types";
import {
  baselineCount,
  biggestLeakLine,
  categoryLabel,
  focusEvidence,
  keepDoingLine,
  missBreakdown,
  mistakeBreakdown,
  resultBreakdown,
  teeOutcomeBreakdown,
  toParLabel,
} from "./format";
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
  const { round, analysis, baseline, recommendations, completedRoundCount } =
    view;
  const {
    summary,
    benchmark,
    shotsToGetBack,
    tee,
    approach,
    approachBands,
    faults,
    priority,
    observations,
  } = analysis;
  const approachAttempts =
    approach.successes + approach.failures + approach.layups;
  const showFaults =
    faults.totalMistakes > 0 || faults.bunkerHoles.length > 0;

  const longLagThreePutts = observations.some(
    (o) => o.id === "three-putts" && /long range/i.test(o.text),
  );
  const roundsToUnlock = Math.max(
    0,
    RECOMMENDATION_MIN_ROUNDS - completedRoundCount,
  );

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

      <section className={styles.tier}>
        <h2 className={styles.tierTitle}>Facts</h2>

      <Card>
        <h3 className={styles.cardTitle}>The round</h3>
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
        <h3 className={styles.cardTitle}>Against the benchmark</h3>
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
            {baseline ? (
              <span className={styles.compare}>
                recent form{" "}
                {baselineCount(
                  baseline.enteredInRegulationRate,
                  benchmark.enteredInRegulation.of,
                )}
              </span>
            ) : null}
          </div>
          <div>
            <span className={styles.bigStat}>
              {benchmark.downInThree.count}
              <span className={styles.ofStat}>/{benchmark.downInThree.of}</span>
            </span>
            <span className={styles.statLabel}>got down in three</span>
            {baseline ? (
              <span className={styles.compare}>
                recent form{" "}
                {baselineCount(
                  baseline.downInThreeRate,
                  benchmark.downInThree.of,
                )}
              </span>
            ) : null}
          </div>
        </div>

        {baseline ? (
          <p className={styles.benchmarkNote}>
            {baseline.confidence === "early"
              ? `Early read — only ${baseline.roundsUsed} rounds so far, across different courses.`
              : `Your last ${baseline.roundsUsed} rounds, across different courses.`}
          </p>
        ) : null}

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
        <h3 className={styles.cardTitle}>Shots to get back</h3>
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

      {tee.recorded > 0 ? (
        <Card>
          <h3 className={styles.cardTitle}>Off the tee</h3>
          <p className={styles.teeBreakdown}>{teeOutcomeBreakdown(tee)}</p>
          {tee.costlyOffTee > 0 ? (
            <p className={styles.teeCostly}>
              {tee.costlyOffTee} tee shot{tee.costlyOffTee === 1 ? "" : "s"}{" "}
              forced a recovery or cost a penalty
              {tee.costlyHoles.length > 0
                ? ` (hole${tee.costlyHoles.length === 1 ? "" : "s"} ${tee.costlyHoles.join(", ")})`
                : ""}
              .
            </p>
          ) : (
            <p className={styles.clean}>Nothing off the tee cost you a stroke.</p>
          )}
          <p className={styles.teeNote}>
            Judged by consequence, not fairways hit. Where the stroke actually
            leaked comes with approach tracking.
          </p>
        </Card>
      ) : null}

      {approachAttempts > 0 ? (
        <Card>
          <h3 className={styles.cardTitle}>Approach play</h3>
          <p className={styles.teeBreakdown}>
            {approach.successes}/{approach.ratedAttempts} found the green or zone
            {approach.layups > 0
              ? ` · ${approach.layups} lay-up${approach.layups === 1 ? "" : "s"}`
              : ""}
          </p>
          {approachBands.totalMisses > 0 ? (
            <p className={styles.teeCostly}>
              Missed {approachBands.totalMisses} — {missBreakdown(approachBands.misses)}
            </p>
          ) : (
            <p className={styles.clean}>No approaches missed the zone.</p>
          )}
        </Card>
      ) : null}

      {showFaults ? (
        <Card>
          <h3 className={styles.cardTitle}>Mistakes &amp; bunkers</h3>
          {faults.totalMistakes > 0 ? (
            <p className={styles.teeBreakdown}>
              {mistakeBreakdown(faults.mistakeCounts)}
            </p>
          ) : (
            <p className={styles.clean}>No mistakes flagged this round.</p>
          )}
          {faults.bunkerHoles.length > 0 ? (
            <p className={styles.teeCostly}>
              In a bunker on {faults.bunkerHoles.length} hole
              {faults.bunkerHoles.length === 1 ? "" : "s"} (
              {faults.bunkerHoles.join(", ")})
              {faults.bunkerStuckHoles.length > 0
                ? ` — needed 2+ to escape on ${faults.bunkerStuckHoles.join(", ")}`
                : ""}
              .
            </p>
          ) : (
            <p className={styles.clean}>No bunkers.</p>
          )}
        </Card>
      ) : null}

      </section>

      <section className={styles.tier}>
        <h2 className={styles.tierTitle}>This round</h2>

      {priority.top || observations.length > 0 ? (
        <Card>
          <h3 className={styles.cardTitle}>What stood out</h3>
          {priority.top ? (
            <p className={styles.biggestLeak}>
              This round, {biggestLeakLine(priority.top)}.
            </p>
          ) : null}
          {observations.length > 0 ? (
            <ul className={styles.observations}>
              {observations.map((o) => (
                <li key={o.id}>{o.text}</li>
              ))}
            </ul>
          ) : null}
        </Card>
      ) : (
        <Card>
          <p className={styles.clean}>
            Nothing out of the ordinary this round.
          </p>
        </Card>
      )}

      </section>

      <section className={styles.tier}>
        <h2 className={styles.tierTitle}>Your game</h2>

      <Card>
        <h3 className={styles.cardTitle}>Focus</h3>
        {recommendations ? (
          <div className={styles.recommendations}>
            {recommendations.confidence === "early" ? (
              <p className={styles.recNote}>
                Early call — {recommendations.roundsUsed} rounds so far.
              </p>
            ) : null}

            <div className={styles.rec}>
              <span className={styles.recLabel}>Focus</span>
              <p className={styles.recBody}>
                <strong>{categoryLabel(recommendations.primary.category)}</strong>{" "}
                — {focusEvidence(recommendations.primary, recommendations.roundsUsed)}.
              </p>
            </div>

            {recommendations.secondary ? (
              <div className={styles.rec}>
                <span className={styles.recLabel}>Then</span>
                <p className={styles.recBody}>
                  <strong>
                    {categoryLabel(recommendations.secondary.category)}
                  </strong>{" "}
                  —{" "}
                  {focusEvidence(
                    recommendations.secondary,
                    recommendations.roundsUsed,
                  )}
                  .
                </p>
              </div>
            ) : null}

            {recommendations.confidence === "firm" ? (
              <div className={styles.rec}>
                <span className={styles.recLabel}>Keep doing</span>
                <p className={styles.recBody}>
                  {recommendations.keepDoing
                    ? keepDoingLine(recommendations.keepDoing)
                    : "Nothing jumped out as a clear strength this stretch."}
                </p>
              </div>
            ) : null}
          </div>
        ) : roundsToUnlock > 0 ? (
          <p className={styles.locked}>
            Your Primary / Secondary focus unlocks after about{" "}
            {RECOMMENDATION_MIN_ROUNDS} rounds — {roundsToUnlock} to go.
          </p>
        ) : (
          <p className={styles.locked}>
            No area is clearly costing you shots across your recent rounds — keep
            it up.
          </p>
        )}
      </Card>

      {completedRoundCount >= GAME_TREND_MIN_ROUNDS ? (
        <Card>
          <h3 className={styles.cardTitle}>Trends</h3>
          <p className={styles.trendSnapshot}>
            {baseline
              ? `Recent form: entered ~${baselineCount(baseline.enteredInRegulationRate, benchmark.enteredInRegulation.of).slice(1)} in regulation, down in three ~${baselineCount(baseline.downInThreeRate, benchmark.downInThree.of).slice(1)}.`
              : `${completedRoundCount} completed rounds so far.`}
          </p>
          <Link href="/trends" className={styles.trendLink}>
            See your trends →
          </Link>
        </Card>
      ) : null}

      </section>
    </div>
  );
};
