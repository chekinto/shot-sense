import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
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
  render(
    <HoleForm
      hole={h}
      scoringZoneYards={100}
      isLastPlannedHole={false}
      hasPrevious
      onPatch={jest.fn()}
      onFlush={asyncNoop}
      onComplete={onComplete}
      onPrevious={noop}
      onCompleted={noop}
      {...extra}
    />,
  );
  return { onComplete };
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
