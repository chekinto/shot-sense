import { render, screen } from "@testing-library/react";
import { LoginForm } from "./LoginForm";

jest.mock("@/features/auth/actions", () => ({
  signIn: jest.fn(async () => ({})),
}));

describe("LoginForm", () => {
  it("renders email and password fields and a submit button", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  it("carries a safe `next` target as a hidden field", () => {
    const { container } = render(<LoginForm next="/rounds/new" />);
    const hidden = container.querySelector('input[name="next"]');
    expect(hidden).toHaveValue("/rounds/new");
  });

  it("omits the hidden field when there is no next target", () => {
    const { container } = render(<LoginForm />);
    expect(container.querySelector('input[name="next"]')).toBeNull();
  });
});
