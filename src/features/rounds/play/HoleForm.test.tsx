import type { ComponentProps } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HoleForm } from "./HoleForm";
import type { PlayHole } from "../types";

const hole = (overrides: Partial<PlayHole> = {}): PlayHole => ({
  holeNumber: 1,
  par: 4,
  yardage: 380,
  isComplete: false,
  version: 1,
  score: null,
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
  ...overrides,
});

const noop = () => {};
const asyncNoop = async () => {};

const renderForm = (
  h: PlayHole,
  extra: Partial<ComponentProps<typeof HoleForm>> = {},
) => {
  const onComplete = jest.fn(async () => ({ completedHoleCount: 1 }));
  const onPatch = jest.fn();
  render(
    <HoleForm
      hole={h}
      scoringZoneYards={100}
      isLastPlannedHole={false}
      hasPrevious
      onPatch={onPatch}
      onFlush={asyncNoop}
      onComplete={onComplete}
      onPrevious={noop}
      onCompleted={noop}
      {...extra}
    />,
  );
  return { onComplete, onPatch };
};

describe("HoleForm", () => {
  it("shows the core steppers and hides first-putt distance until there are putts", () => {
    renderForm(hole());
    expect(screen.getByRole("group", { name: "Score" })).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: /shots to reach inside 100 yds/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Putts" })).toBeInTheDocument();
    expect(
      screen.queryByRole("radiogroup", { name: /first putt distance/i }),
    ).not.toBeInTheDocument();
  });

  it("reveals first-putt distance once putts > 0", () => {
    renderForm(hole({ putts: 2 }));
    expect(
      screen.getByRole("radiogroup", { name: /first putt distance/i }),
    ).toBeInTheDocument();
  });

  it("derives shots from zone from score and shots to zone", () => {
    renderForm(hole({ score: 5, shotsToZone: 2 }));
    expect(screen.getByText(/shots from zone:/i)).toHaveTextContent("3");
  });

  it("reveals a penalty stepper on demand", async () => {
    const user = userEvent.setup();
    renderForm(hole());
    await user.click(screen.getByRole("button", { name: /\+ penalty/i }));
    expect(
      screen.getByRole("group", { name: "Penalty strokes" }),
    ).toBeInTheDocument();
  });

  it("always shows the tee outcome and lie controls", () => {
    renderForm(hole());
    expect(
      screen.getByRole("radiogroup", { name: /off the tee/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radiogroup", { name: /tee shot ended up/i }),
    ).toBeInTheDocument();
  });

  it("auto-fills a penalty stroke and reveals the stepper when the tee shot is a penalty", async () => {
    const user = userEvent.setup();
    const { onPatch } = renderForm(hole());
    const teeGroup = screen.getByRole("radiogroup", { name: /off the tee/i });
    await user.click(within(teeGroup).getByRole("radio", { name: "Penalty" }));
    expect(onPatch).toHaveBeenCalledWith({
      teeOutcome: "penalty",
      penaltyStrokes: 1,
    });
  });

  it("shows the penalty stepper when the hole already has a tee penalty", () => {
    renderForm(hole({ teeOutcome: "penalty", penaltyStrokes: 1 }));
    expect(
      screen.getByRole("group", { name: "Penalty strokes" }),
    ).toBeInTheDocument();
  });

  it("nudges when a tee penalty has no penalty strokes on the hole", () => {
    renderForm(hole({ teeOutcome: "penalty", penaltyStrokes: 0 }));
    expect(screen.getByText(/no penalty strokes yet/i)).toBeInTheDocument();
  });

  it("reveals bunker steppers and defaults bunkers-visited to 1", async () => {
    const user = userEvent.setup();
    const { onPatch } = renderForm(hole());
    await user.click(screen.getByRole("button", { name: /\+ bunker/i }));
    await user.click(screen.getByRole("button", { name: /increase bunker shots/i }));
    expect(onPatch).toHaveBeenLastCalledWith({ bunkerShots: 1, bunkersVisited: 1 });
  });

  it("shows the bunkers-visited stepper only once there are bunker shots", () => {
    renderForm(hole({ bunkerShots: 2, bunkersVisited: 1 }));
    expect(
      screen.getByRole("group", { name: "Bunkers visited" }),
    ).toBeInTheDocument();
  });

  it("reveals mistake chips and toggles them", async () => {
    const user = userEvent.setup();
    const { onPatch } = renderForm(hole());
    await user.click(screen.getByRole("button", { name: /\+ mistake/i }));
    await user.click(screen.getByRole("button", { name: "Strategy" }));
    expect(onPatch).toHaveBeenLastCalledWith({ mistakes: ["strategy"] });
  });

  it("passes bunker counts and mistakes to onComplete", async () => {
    const user = userEvent.setup();
    const { onComplete } = renderForm(
      hole({
        score: 6,
        shotsToZone: 2,
        putts: 2,
        firstPuttDistance: "5-15ft",
        bunkerShots: 2,
        bunkersVisited: 1,
        mistakes: ["short-game"],
      }),
    );
    await user.click(screen.getByRole("button", { name: /save & next/i }));
    expect(onComplete).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        bunkerShots: 2,
        bunkersVisited: 1,
        mistakes: ["short-game"],
      }),
    );
  });

  it("reveals the approach section and seeds a first attempt", async () => {
    const user = userEvent.setup();
    const { onPatch } = renderForm(hole());
    await user.click(screen.getByRole("button", { name: /\+ approach/i }));
    expect(onPatch).toHaveBeenCalledWith(
      expect.objectContaining({
        approaches: [
          expect.objectContaining({ sequence: 1, result: "green" }),
        ],
      }),
    );
  });

  it("blocks completion when a missed approach has no direction", async () => {
    const user = userEvent.setup();
    const { onComplete } = renderForm(
      hole({
        score: 4,
        shotsToZone: 2,
        putts: 2,
        firstPuttDistance: "5-15ft",
        approaches: [
          {
            sequence: 1,
            distanceBand: "150-174",
            result: "missed-zone",
            missDirection: null,
          },
        ],
      }),
    );
    await user.click(screen.getByRole("button", { name: /save & next/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/miss direction/i);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("passes the approach list to onComplete", async () => {
    const user = userEvent.setup();
    const approaches = [
      {
        sequence: 1,
        distanceBand: "150-174" as const,
        result: "green" as const,
        missDirection: null,
      },
    ];
    const { onComplete } = renderForm(
      hole({
        score: 4,
        shotsToZone: 2,
        putts: 2,
        firstPuttDistance: "5-15ft",
        approaches,
      }),
    );
    await user.click(screen.getByRole("button", { name: /save & next/i }));
    expect(onComplete).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ approaches }),
    );
  });

  it("passes tee outcome and lie to onComplete", async () => {
    const user = userEvent.setup();
    const { onComplete } = renderForm(
      hole({
        score: 4,
        shotsToZone: 2,
        putts: 2,
        firstPuttDistance: "5-15ft",
        teeOutcome: "clear",
        teeLie: "fairway",
      }),
    );
    await user.click(screen.getByRole("button", { name: /save & next/i }));
    expect(onComplete).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ teeOutcome: "clear", teeLie: "fairway" }),
    );
  });

  it("blocks completion with a validation message when the hole is incomplete", async () => {
    const user = userEvent.setup();
    const { onComplete } = renderForm(hole({ score: null }));
    await user.click(screen.getByRole("button", { name: /save & next/i }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("completes a valid hole with its values", async () => {
    const user = userEvent.setup();
    const { onComplete } = renderForm(
      hole({ score: 4, shotsToZone: 2, putts: 2, firstPuttDistance: "5-15ft" }),
    );
    await user.click(screen.getByRole("button", { name: /save & next/i }));
    expect(onComplete).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ score: 4, shotsToZone: 2, putts: 2 }),
    );
  });

  it("stays an editable form with its values filled when the hole is complete", () => {
    renderForm(
      hole({
        isComplete: true,
        score: 4,
        shotsToZone: 2,
        putts: 2,
        firstPuttDistance: "5-15ft",
      }),
    );
    expect(screen.getByRole("group", { name: "Score" })).toBeInTheDocument();
    expect(
      screen.getByRole("radiogroup", { name: /first putt distance/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/recorded/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^next/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /save & next/i }),
    ).not.toBeInTheDocument();
  });

  it("has Previous and a save-carrying Next, and no third button", () => {
    renderForm(hole());
    const buttons = screen
      .getAllByRole("button")
      .map((b) => b.textContent?.trim());
    expect(buttons).toEqual(
      expect.arrayContaining(["← Previous", "Save & next →"]),
    );
    expect(buttons).not.toContain("Next →");
  });

  it("disables Previous on the first hole", () => {
    renderForm(hole(), { hasPrevious: false });
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
  });

  it("goes back without completing when Previous is pressed", async () => {
    const user = userEvent.setup();
    const onPrevious = jest.fn();
    const { onComplete } = renderForm(hole({ score: null }), { onPrevious });
    await user.click(screen.getByRole("button", { name: /previous/i }));
    expect(onPrevious).toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });
});
