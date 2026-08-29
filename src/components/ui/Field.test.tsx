import { render, screen } from "@testing-library/react";
import { Field } from "./Field";

describe("Field", () => {
  it("associates the label with the input", () => {
    render(<Field label="Email" name="email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("marks the input invalid and links the error message", () => {
    render(<Field label="Email" name="email" error="Enter a valid email" />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid email");
    expect(input.getAttribute("aria-describedby")).toContain(
      screen.getByRole("alert").id,
    );
  });

  it("has no error node when there is no error", () => {
    render(<Field label="Email" name="email" />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
