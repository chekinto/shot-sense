import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("landing page", () => {
  it("shows the product promise and both CTAs", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: /understand where your score is really going/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /start tracking your game/i }),
    ).toHaveAttribute("href", "/signup");
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
