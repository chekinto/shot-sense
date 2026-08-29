import { render, screen } from "@testing-library/react";
import { OnboardingForm } from "./OnboardingForm";

jest.mock("@/features/profile/actions", () => ({
  saveHandicap: jest.fn(async () => ({})),
}));

describe("OnboardingForm", () => {
  it("renders a handicap field and a skip link", () => {
    render(<OnboardingForm />);
    expect(screen.getByLabelText("Handicap")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /skip for now/i })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });
});
