import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HoleForm } from "./HoleForm";
import { completeHole } from "../recordActions";
import type { PlayHole } from "../types";

jest.mock("../recordActions", () => ({
  completeHole: jest.fn(async () => ({ ok: true, completedHoleCount: 1 })),
}));

const completeHoleMock = completeHole as jest.MockedFunction<typeof completeHole>;

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
  penaltyStrokes: 0,
  ...overrides,
});

const noop = () => {};
const asyncNoop = async () => {};

const renderForm = (
  h: PlayHole,
  extra: Partial<ComponentProps<typeof HoleForm>> = {},
) =>
  render(
    <HoleForm
      roundId="r1"
      hole={h}
      scoringZoneYards={100}
      isLastPlannedHole={false}
      hasPrevious
      onPatch={jest.fn()}
      onFlush={asyncNoop}
      onPrevious={noop}
      onCompleted={noop}
      {...extra}
    />,
  );

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

  it("blocks completion with a validation message when the hole is incomplete", async () => {
    const user = userEvent.setup();
    renderForm(hole({ score: null }));
    await user.click(screen.getByRole("button", { name: /save & next/i }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(completeHoleMock).not.toHaveBeenCalled();
  });

  it("completes a valid hole", async () => {
    const user = userEvent.setup();
    renderForm(
      hole({ score: 4, shotsToZone: 2, putts: 2, firstPuttDistance: "5-15ft" }),
    );
    await user.click(screen.getByRole("button", { name: /save & next/i }));
    expect(completeHoleMock).toHaveBeenCalledWith(
      expect.objectContaining({ roundId: "r1", holeNumber: 1, score: 4 }),
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
    // Still the live form, not a read-only summary.
    expect(screen.getByRole("group", { name: "Score" })).toBeInTheDocument();
    expect(
      screen.getByRole("radiogroup", { name: /first putt distance/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/recorded/i)).toBeInTheDocument();
    // "Next" carries the advance; no separate save button, no "Edit hole".
    expect(screen.getByRole("button", { name: /^next/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /edit hole/i }),
    ).not.toBeInTheDocument();
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
    renderForm(hole({ score: null }), { onPrevious });
    await user.click(screen.getByRole("button", { name: /previous/i }));
    expect(onPrevious).toHaveBeenCalled();
    expect(completeHoleMock).not.toHaveBeenCalled();
  });

  it("shows the recorded value in the Score stepper", () => {
    renderForm(hole({ isComplete: true, score: 6, shotsToZone: 3, putts: 2 }));
    expect(
      screen.getByRole("group", { name: "Score" }),
    ).toHaveTextContent("6");
  });
});
