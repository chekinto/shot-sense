/**
 * §9 — `Shots From Zone = Score − Shots to Zone`. Putting strokes are included
 * in Shots From Zone. The invariant `Shots to Zone + Shots From Zone = Score`
 * always holds, including on holes with penalty strokes (§2 correction — penalty
 * strokes are counted into `shotsToZone` when the offending shot was played from
 * outside the zone, otherwise they fall naturally into Shots From Zone).
 *
 * Throws on an invariant violation so a bad mapper is caught loudly rather than
 * silently producing negative Shots From Zone.
 */
export const calculateShotsFromZone = (input: {
  score: number;
  shotsToZone: number;
}): number => {
  const { score, shotsToZone } = input;
  if (shotsToZone < 0) {
    throw new RangeError(`shotsToZone must be >= 0, got ${shotsToZone}`);
  }
  if (shotsToZone > score) {
    throw new RangeError(
      `shotsToZone (${shotsToZone}) cannot exceed score (${score})`,
    );
  }
  return score - shotsToZone;
};
