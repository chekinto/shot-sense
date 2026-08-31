import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MistakeTags } from "./MistakeTags";
import type { MistakeCategory } from "@/domain/scoring";

const Harness = ({ initial = [] as MistakeCategory[] }) => {
  const [value, setValue] = useState<MistakeCategory[]>(initial);
  return <MistakeTags value={value} onChange={setValue} />;
};

describe("MistakeTags", () => {
  it("adds and removes categories on tap", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const strategy = screen.getByRole("button", { name: "Strategy" });
    await user.click(strategy);
    expect(strategy).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Putting" }));
    await user.click(strategy);
    expect(strategy).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Putting" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("renders all seven categories", () => {
    render(<Harness />);
    expect(screen.getByRole("group", { name: /mistakes/i })).toBeInTheDocument();
    for (const label of [
      "Tee",
      "Approach",
      "Short game",
      "Putting",
      "Strategy",
      "Recovery",
      "Other",
    ]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });
});
