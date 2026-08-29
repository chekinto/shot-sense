import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CourseForm } from "./CourseForm";

jest.mock("./actions", () => ({
  createCourse: jest.fn(async () => ({})),
  updateCourseDetails: jest.fn(async () => ({})),
}));

const parsHiddenValue = (container: HTMLElement): number[] =>
  JSON.parse(
    (container.querySelector('input[name="pars"]') as HTMLInputElement).value,
  );

describe("CourseForm", () => {
  it("defaults to 18 holes with 18 par rows", () => {
    const { container } = render(<CourseForm mode="create" />);
    expect(screen.getAllByRole("radiogroup", { name: /par for hole/i })).toHaveLength(
      18,
    );
    expect(parsHiddenValue(container)).toHaveLength(18);
    expect(screen.getByText(/total 72/i)).toBeInTheDocument();
  });

  it("resizes the par list when switching to 9 holes", async () => {
    const user = userEvent.setup();
    const { container } = render(<CourseForm mode="create" />);

    await user.click(screen.getByRole("radio", { name: "9" }));

    expect(screen.getAllByRole("radiogroup", { name: /par for hole/i })).toHaveLength(9);
    expect(parsHiddenValue(container)).toHaveLength(9);
    expect(screen.getByText(/total 36/i)).toBeInTheDocument();
  });

  it("updates the running total when a par changes", async () => {
    const user = userEvent.setup();
    const { container } = render(<CourseForm mode="create" />);

    const holeOne = screen.getByRole("radiogroup", { name: /par for hole 1$/i });
    await user.click(within(holeOne).getByRole("radio", { name: "5" }));

    expect(parsHiddenValue(container)[0]).toBe(5);
    expect(screen.getByText(/total 73/i)).toBeInTheDocument();
  });

  it("locks the hole count in edit mode", () => {
    render(
      <CourseForm
        mode="edit"
        courseId="c1"
        initialName="X"
        initialHoleCount={9}
        initialPars={Array.from({ length: 9 }, () => 4)}
      />,
    );
    expect(screen.getByRole("radio", { name: "18" })).toBeDisabled();
    expect(screen.getByText(/hole count can.t change/i)).toBeInTheDocument();
  });
});
