import { render, screen } from "@testing-library/react";
import { analyseRound } from "@/domain/scoring";
import { completedHole, completedRound, eighteenPars } from "@test/scoring/factories";
import { PostRound } from "./PostRound";
import type { PostRoundView } from "./types";

const view = (overrides: Partial<PostRoundView> = {}): PostRoundView => {
  const holes = eighteenPars().map((h, i) => {
    if (i === 3) {
      return completedHole({ holeNumber: 4, par: 4, score: 6, shotsToZone: 3, putts: 2, penaltyStrokes: 1 });
    }
    if (i === 9) {
      return completedHole({ holeNumber: 10, par: 4, score: 6, shotsToZone: 2, putts: 3, firstPuttDistance: "15-30ft" });
    }
    return h;
  });
  return {
    round: {
      id: "r1",
      courseName: "East Herts",
      teeName: "White",
      playedOn: new Date("2026-08-30"),
      plannedHoleCount: 18,
      holesPlayed: 18,
      handicapAtStart: 14,
      status: "completed",
      dataCompleteness: "full",
    },
    analysis: analyseRound(completedRound(holes)),
    baseline: null,
    completedRoundCount: 1,
    ...overrides,
  };
};

describe("PostRound", () => {
  it("leads with the score and the round breakdown", () => {
    render(<PostRound view={view()} />);
    expect(screen.getByText("East Herts · White · 8/30/2026")).toBeInTheDocument();
    expect(screen.getByText("Front 9")).toBeInTheDocument();
    expect(screen.getByText("Back 9")).toBeInTheDocument();
  });

  it("shows the benchmark scorecard and leak holes", () => {
    render(<PostRound view={view()} />);
    expect(screen.getByText(/entered in regulation/i)).toBeInTheDocument();
    expect(screen.getByText(/got down in three/i)).toBeInTheDocument();
    expect(screen.getByText(/where shots leaked/i)).toBeInTheDocument();
  });

  it("shows Shots to Get Back with its breakdown", () => {
    render(<PostRound view={view()} />);
    const stgb = screen.getByText("Shots to get back").closest("div")!;
    expect(stgb).toHaveTextContent(/penalty/);
    expect(stgb).toHaveTextContent(/putting/);
  });

  it("names the round's biggest leak in the This round card", () => {
    render(<PostRound view={view()} />);
    // hole 4 penalty double + hole 10 three-putt → putting or penalty leads.
    expect(screen.getByText(/this round, your .+ leaked the most/i)).toBeInTheDocument();
  });

  it("shows the recent-form baseline and its caveat when present", () => {
    render(
      <PostRound
        view={view({
          baseline: {
            roundsUsed: 4,
            confidence: "early",
            enteredInRegulationRate: 0.5,
            downInThreeRate: 0.5,
            scoreToParPerHole: 0.5,
            shotsToGetBackPerHole: 0.3,
            commonLeak: null,
          },
        })}
      />,
    );
    expect(screen.getAllByText(/recent form ~9\/18/).length).toBeGreaterThan(0);
    expect(screen.getByText(/early read — only 4 rounds/i)).toBeInTheDocument();
  });

  it("locks the Your game tier with a rounds-to-go count", () => {
    render(<PostRound view={view({ completedRoundCount: 2 })} />);
    expect(screen.getByText(/unlock after about 5 rounds — 3 to go/i)).toBeInTheDocument();
  });

  it("renders 'Played N' for a 9-hole round", () => {
    const nine = Array.from({ length: 9 }, (_, i) => completedHole({ holeNumber: i + 1 }));
    render(
      <PostRound
        view={view({
          round: {
            id: "r2",
            courseName: "Muni",
            teeName: null,
            playedOn: new Date("2026-08-30"),
            plannedHoleCount: 9,
            holesPlayed: 9,
            handicapAtStart: null,
            status: "completed",
            dataCompleteness: "full",
          },
          analysis: analyseRound(completedRound(nine, { plannedHoleCount: 9 })),
        })}
      />,
    );
    expect(screen.getByText("Played 9")).toBeInTheDocument();
    expect(screen.queryByText("Front 9")).not.toBeInTheDocument();
  });
});
