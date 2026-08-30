import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StartRoundForm } from "./StartRoundForm";
import type { StartRoundCourse } from "./service";

jest.mock("./actions", () => ({
  startRound: jest.fn(async () => ({})),
}));

const courses: StartRoundCourse[] = [
  { id: "c1", name: "East Herts", holeCount: 18, teeSets: [{ id: "t1", name: "White" }] },
  { id: "c2", name: "Muni Nine", holeCount: 9, teeSets: [] },
];

describe("StartRoundForm", () => {
  it("disables Start until a course is chosen", () => {
    render(<StartRoundForm courses={courses} defaultHandicap={14} />);
    expect(screen.getByRole("button", { name: /start round/i })).toBeDisabled();
  });

  it("reveals the tee picker only for a course that has tees", async () => {
    const user = userEvent.setup();
    render(<StartRoundForm courses={courses} defaultHandicap={null} />);

    await user.click(screen.getByRole("radio", { name: /east herts/i }));
    expect(screen.getByRole("radio", { name: "White" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "No tee" })).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /muni nine/i }));
    expect(screen.queryByRole("radio", { name: "White" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start round/i })).toBeEnabled();
  });

  it("prefills the handicap from the profile", () => {
    render(<StartRoundForm courses={courses} defaultHandicap={14} />);
    expect(screen.getByLabelText(/handicap for this round/i)).toHaveValue(14);
  });
});
