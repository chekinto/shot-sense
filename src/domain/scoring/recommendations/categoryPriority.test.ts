import { calculateCategoryPriority } from "./categoryPriority";
import {
  completedHole,
  completedRound,
  eighteenPars,
} from "@test/scoring/factories";

const bySeverity = (round: Parameters<typeof calculateCategoryPriority>[0]) =>
  calculateCategoryPriority(round).categories.map((c) => [
    c.category,
    c.severity,
  ]);

describe("calculateCategoryPriority", () => {
  it("is empty for a clean level-par round", () => {
    const result = calculateCategoryPriority(completedRound(eighteenPars()));
    expect(result.categories).toEqual([]);
    expect(result.top).toBeNull();
  });

  it("attributes putts over two to putting, half for a long lag", () => {
    const result = calculateCategoryPriority(
      completedRound([
        completedHole({
          holeNumber: 1,
          score: 6,
          shotsToZone: 2,
          putts: 4,
          firstPuttDistance: "5-15ft",
        }), // +2 putting
        completedHole({
          holeNumber: 2,
          score: 6,
          shotsToZone: 2,
          putts: 4,
          firstPuttDistance: "50ft-plus",
        }), // +1 (halved long lag)
      ]),
    );
    const putting = result.categories.find((c) => c.category === "putting");
    expect(putting?.severity).toBe(3);
    expect(putting?.frequency).toBe(2);
  });

  it("caps the tee shot's share of the to-zone leak by its outcome", () => {
    // toZoneLeak of 3, but a merely 'compromised' tee shot only owns 1 of it.
    const result = calculateCategoryPriority(
      completedRound([
        completedHole({
          holeNumber: 1,
          par: 4,
          score: 7,
          shotsToZone: 5,
          putts: 2,
          teeOutcome: "compromised",
        }),
      ]),
    );
    const tee = result.categories.find((c) => c.category === "tee");
    const approach = result.categories.find((c) => c.category === "approach");
    expect(tee?.severity).toBe(1);
    expect(approach?.severity).toBe(2); // remaining leak, capped at 2
  });

  it("blends the golfer's own mistake tags in at half a shot each", () => {
    const result = calculateCategoryPriority(
      completedRound([
        completedHole({ holeNumber: 1, mistakes: ["strategy", "strategy"] }),
      ]),
    );
    const strategy = result.categories.find((c) => c.category === "strategy");
    expect(strategy).toMatchObject({ severity: 1, frequency: 1, flagged: 2 });
  });

  it("ranks by severity, then frequency, then category order", () => {
    const round = completedRound([
      // putting: 1 shot on 1 hole
      completedHole({ holeNumber: 1, score: 5, shotsToZone: 2, putts: 3, firstPuttDistance: "5-15ft" }),
      // short game: 1 shot on 1 hole (fromZoneLeak 1, no extra putts)
      completedHole({ holeNumber: 2, score: 5, shotsToZone: 1, putts: 2, firstPuttDistance: "5-15ft" }),
    ]);
    // Equal severity (1) and frequency (1) → §40 order puts short-game before putting.
    expect(bySeverity(round)).toEqual([
      ["short-game", 1],
      ["putting", 1],
    ]);
  });

  it("excludes picked-up holes", () => {
    const result = calculateCategoryPriority(
      completedRound([
        completedHole({
          holeNumber: 1,
          pickedUp: true,
          score: 9,
          shotsToZone: 5,
          putts: 3,
          firstPuttDistance: "5-15ft",
          mistakes: ["putting"],
        }),
        completedHole({ holeNumber: 2 }),
      ]),
    );
    expect(result.categories).toEqual([]);
  });
});
