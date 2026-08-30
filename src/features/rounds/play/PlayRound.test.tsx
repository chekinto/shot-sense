import { act, render, screen, waitFor } from "@testing-library/react";
import { PlayRound } from "./PlayRound";
import type { PlayHole, PlayableRound } from "../types";

jest.mock("@/infrastructure/offline/sync", () => ({
  flushRound: jest.fn(async () => "nothing"),
  flushAll: jest.fn(async () => undefined),
  startBackgroundSync: jest.fn(() => () => {}),
}));

// The store has its own tests; here we only care about PlayRound's rendering.
jest.mock("@/infrastructure/offline/activeRoundStore", () => ({
  activeRoundStore: {
    hydrate: jest.fn(async (r: { holes: unknown[] }) => ({ holes: r.holes })),
    pendingCount: jest.fn(async () => 0),
    patchHole: jest.fn(),
    completeHole: jest.fn(async () => ({ completedHoleCount: 0, hole: {} })),
  },
}));

// `recordActions` pulls in `next/cache` (server-only) — not needed here.
jest.mock("../recordActions", () => ({
  finishRound: jest.fn(async () => ({ ok: false, incompleteHoles: [] })),
}));

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

const setOnline = (value: boolean) => {
  Object.defineProperty(navigator, "onLine", { value, configurable: true });
  window.dispatchEvent(new Event(value ? "online" : "offline"));
};

afterEach(() => setOnline(true));

describe("PlayRound", () => {
  it("renders the current hole with no save-state chatter", async () => {
    render(<PlayRound round={round} startHole={1} />);
    expect(
      await screen.findByRole("heading", { name: /hole 1 of 2/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Test Links · White")).toBeInTheDocument();
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
    expect(screen.queryByText("Saving…")).not.toBeInTheDocument();
  });

  it("shows an offline notice when the connection drops", async () => {
    render(<PlayRound round={round} startHole={1} />);
    await screen.findByRole("heading", { name: /hole 1 of 2/i });

    act(() => setOnline(false));

    await waitFor(() =>
      expect(screen.getByText(/offline — your round is saved/i)).toBeInTheDocument(),
    );
  });
});
