import { analyseRound } from "@/domain/scoring";
import { canonicalRound } from "./canonicalRound";

/**
 * Golden-file / parity test.
 *
 * The committed snapshot is the canonical analysis output for {@link canonicalRound}.
 * Any drift in the deterministic engine fails CI and must be an intentional,
 * reviewed change (and a METHODOLOGY_VERSION bump).
 *
 * When the server-side engine path exists, add a sibling assertion here that
 * runs the same fixture through it and `toEqual`s the client output.
 */
describe("scoring engine — golden output", () => {
  it("produces the canonical analysis for the reference round", () => {
    expect(analyseRound(canonicalRound)).toMatchSnapshot();
  });

  it("is deterministic across repeated calls", () => {
    expect(analyseRound(canonicalRound)).toEqual(analyseRound(canonicalRound));
  });
});
