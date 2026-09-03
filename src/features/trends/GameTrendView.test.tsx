import { render, screen } from "@testing-library/react";
import { calculateGameTrend } from "@/domain/scoring";
import { completedHole, completedRound, eighteenPars } from "@test/scoring/factories";
import { GameTrendView } from "./GameTrendView";

const trendFrom = (ids: string[]) =>
  calculateGameTrend(
    ids.map((id) =>
      completedRound(
        eighteenPars().map((h, i) =>
          i === 0
            ? completedHole({ holeNumber: 1, score: 6, shotsToZone: 2, putts: 4, firstPuttDistance: "5-15ft" })
            : h,
        ),
        { id },
      ),
    ),
  )!;

describe("GameTrendView", () => {
  it("renders a row per benchmark metric with a sparkline", () => {
    render(<GameTrendView trend={trendFrom(["a", "b", "c"])} />);
    expect(
      screen.getByRole("heading", { name: /against the benchmark/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Entered in regulation")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /score to par over your last 3 rounds/i }),
    ).toBeInTheDocument();
  });

  it("keeps the approach-band section locked with a count", () => {
    render(<GameTrendView trend={trendFrom(["a", "b", "c"])} />);
    expect(
      screen.getByText(/band-level patterns unlock after about 15 rounds/i),
    ).toBeInTheDocument();
  });

  it("surfaces a recurring leak", () => {
    render(<GameTrendView trend={trendFrom(["a", "b", "c"])} />);
    expect(screen.getByText(/what keeps coming up/i)).toBeInTheDocument();
    expect(screen.getByText(/putting/i)).toBeInTheDocument();
  });
});
