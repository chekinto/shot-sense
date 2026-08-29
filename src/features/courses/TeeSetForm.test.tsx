import { render, screen } from "@testing-library/react";
import { TeeSetForm } from "./TeeSetForm";

jest.mock("./actions", () => ({
  saveTeeSet: jest.fn(async () => ({})),
  deleteTeeSet: jest.fn(async () => ({})),
}));

const holeNumbers = [1, 2, 3];

describe("TeeSetForm", () => {
  it("renders an add form with a yardage input per hole", () => {
    render(<TeeSetForm courseId="c1" holeNumbers={holeNumbers} />);
    expect(screen.getByRole("button", { name: /add tee/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Yardage for hole 1")).toHaveValue(null);
    expect(screen.getByLabelText("Yardage for hole 3")).toBeInTheDocument();
  });

  it("prefills name and yardages in edit mode and offers removal", () => {
    render(
      <TeeSetForm
        courseId="c1"
        holeNumbers={holeNumbers}
        teeSet={{
          id: "t1",
          name: "White",
          yardages: [{ holeNumber: 2, yardage: 175 }],
        }}
      />,
    );
    expect(screen.getByLabelText("Tee name")).toHaveValue("White");
    expect(screen.getByLabelText("Yardage for hole 2")).toHaveValue(175);
    expect(screen.getByRole("button", { name: /save tee/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remove white/i })).toBeInTheDocument();
  });
});
