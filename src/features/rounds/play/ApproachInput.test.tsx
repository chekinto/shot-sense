import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApproachInput } from "./ApproachInput";
import type { PlayApproach } from "../types";

const Harness = ({ initial = [] as PlayApproach[] }) => {
  const [approaches, setApproaches] = useState<PlayApproach[]>(initial);
  return <ApproachInput approaches={approaches} onChange={setApproaches} />;
};

describe("ApproachInput", () => {
  it("adds and removes approach rows, renumbering as it goes", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: /add approach/i }));
    expect(screen.getByText("Approach 1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /add another approach/i }));
    expect(screen.getByText("Approach 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /remove approach 1/i }));
    expect(screen.queryByText("Approach 2")).not.toBeInTheDocument();
    expect(screen.getByText("Approach 1")).toBeInTheDocument();
  });

  it("shows a miss-direction control only for a missed result", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initial={[
          {
            sequence: 1,
            distanceBand: "150-174",
            result: "green",
            missDirection: null,
          },
        ]}
      />,
    );
    expect(
      screen.queryByRole("radiogroup", { name: /miss direction/i }),
    ).not.toBeInTheDocument();

    const resultGroup = screen.getByRole("radiogroup", {
      name: /approach 1 result/i,
    });
    await user.click(within(resultGroup).getByRole("radio", { name: "Missed" }));

    expect(
      screen.getByRole("radiogroup", { name: /approach 1 miss direction/i }),
    ).toBeInTheDocument();
  });
});
