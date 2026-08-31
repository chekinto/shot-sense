import { test, expect } from "@playwright/test";
import { backfillRound, signUpAndOnboard, supabaseConfigured } from "./helpers";

test.describe("historical round backfill + baseline", () => {
  test.skip(!supabaseConfigured, "needs a Supabase test project");
  test.describe.configure({ timeout: 120_000 });

  test("add past rounds, see them in history, and get a baseline at round 3", async ({
    page,
  }) => {
    await signUpAndOnboard(page, "backfill");

    // First backfilled round — a clean par 36.
    await backfillRound(page, { courseName: "Old Course" });
    await expect(page.getByText(/Old Course/)).toBeVisible();
    await expect(page.getByText("36", { exact: true })).toBeVisible();
    // One round in — no baseline yet.
    await expect(page.getByText(/recent form/i)).toHaveCount(0);

    // History page lists it with a backfilled badge.
    await page.goto("/rounds");
    await expect(page.getByText("Old Course")).toBeVisible();
    await expect(page.getByText("backfilled")).toBeVisible();

    // Two more rounds — the third summary should show the early-read baseline
    // (built from the two prior rounds).
    await backfillRound(page, { courseName: "Second Track" });
    await backfillRound(page, {
      courseName: "Third Track",
      holeOne: { score: 6, putts: 3 },
    });
    await expect(page.getByText(/early read — only 2 rounds/i)).toBeVisible();
    await expect(page.getByText(/recent form/i).first()).toBeVisible();

    // Edit the third round: fix hole 1 back to a par.
    await page.goto("/rounds");
    await page
      .getByText("Third Track")
      .locator("../..")
      .getByRole("link", { name: "Edit" })
      .click();
    await expect(page).toHaveURL(/\/rounds\/[0-9a-f-]+\/edit$/);
    await page.getByLabel("Hole 1 score").fill("4");
    await page.getByLabel("Hole 1 putts").fill("2");
    await page.getByRole("button", { name: /save changes/i }).click();
    await expect(page).toHaveURL(/\/rounds\/[0-9a-f-]+\/summary$/);
    await expect(page.getByText("36", { exact: true })).toBeVisible();

    // Delete it from history.
    await page.goto("/rounds");
    await page
      .getByText("Third Track")
      .locator("../..")
      .getByRole("button", { name: "Delete" })
      .click();
    await expect(page.getByText("Third Track")).toBeHidden();
    await expect(page.getByText("Second Track")).toBeVisible();
  });
});
