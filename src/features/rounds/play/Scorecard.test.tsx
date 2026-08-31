import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Scorecard } from "./Scorecard";
import type { PlayHole } from "../types";

const hole = (n: number, isComplete: boolean, score: number | null): PlayHole => ({
  holeNumber: n,
  par: 4,
  yardage: null,
  isComplete,
  version: 1,
  score,
  shotsToZone: null,
  putts: null,
  firstPuttDistance: null,
  teeOutcome: null,
  teeLie: null,
  approaches: [],
  bunkerShots: 0,
  bunkersVisited: 0,
  mistakes: [],
  penaltyStrokes: 0,
});

describe("Scorecard", () => {
  const holes = [hole(1, true, 5), hole(2, false, null), hole(3, false, null)];

  it("shows the score for finished holes and par for the rest", () => {
    render(<Scorecard holes={holes} currentHole={2} onJump={jest.fn()} />);
    const chips = screen.getAllByRole("button");
    expect(chips[0]).toHaveTextContent("15"); // hole 1, score 5
    expect(chips[1]).toHaveTextContent("24"); // hole 2, par 4
    expect(chips[1]).toHaveAttribute("aria-current", "true");
  });

  it("calls onJump with the hole number", async () => {
    const onJump = jest.fn();
    const user = userEvent.setup();
    render(<Scorecard holes={holes} currentHole={1} onJump={onJump} />);
    await user.click(screen.getAllByRole("button")[2]!);
    expect(onJump).toHaveBeenCalledWith(3);
  });
});
