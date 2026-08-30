import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlayRound } from "./PlayRound";
import { saveHole } from "../recordActions";
import type { PlayHole, PlayableRound } from "../types";

jest.mock("../recordActions", () => ({
  saveHole: jest.fn(async () => ({ ok: true })),
  completeHole: jest.fn(async () => ({ ok: true, completedHoleCount: 0 })),
  finishRound: jest.fn(async () => ({ ok: false, incompleteHoles: [] })),
}));

const saveHoleMock = saveHole as jest.MockedFunction<typeof saveHole>;

const playHole = (holeNumber: number): PlayHole => ({
  holeNumber,
  par: 4,
  yardage: 380,
  isComplete: false,
  version: 1,
  score: null,
  shotsToZone: null,
  putts: null,
  firstPuttDistance: null,
  penaltyStrokes: 0,
});

const round: PlayableRound = {
  id: "r1",
  courseName: "Test Links",
  teeName: "White",
  plannedHoleCount: 2,
  completedHoleCount: 0,
  scoringZoneYards: 100,
  handicapAtStart: 12,
  status: "in-progress",
  holes: [playHole(1), playHole(2)],
};

describe("PlayRound", () => {
  it("renders the current hole without any save-state chatter", () => {
    render(<PlayRound round={round} startHole={1} />);

    expect(
      screen.getByRole("heading", { name: /hole 1 of 2/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Test Links · White")).toBeInTheDocument();
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
    expect(screen.queryByText("Saving…")).not.toBeInTheDocument();
  });

  it("surfaces an error notice only when an autosave fails", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    saveHoleMock.mockResolvedValueOnce({ ok: false, reason: "locked" });

    render(<PlayRound round={round} startHole={1} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /increase score/i }));
    // Advance past the autosave debounce and let the (mocked) save settle.
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/couldn.t save/i),
    );

    jest.useRealTimers();
  });
});
