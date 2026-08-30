import { test, expect } from "@playwright/test";
import { createCourse, signUpAndOnboard, supabaseConfigured } from "./helpers";

test("signed-out visit to /rounds/new redirects to /login", async ({ page }) => {
  await page.goto("/rounds/new");
  await expect(page).toHaveURL(/\/login\?next=%2Frounds%2Fnew$/);
});

test.describe("start a round", () => {
  test.skip(!supabaseConfigured, "needs a Supabase test project");

  test("start on a course + tee, snapshot the holes, resume from dashboard", async ({
    page,
  }) => {
    await signUpAndOnboard(page, "round");
    await createCourse(page, {
      name: "Round Club",
      holeCount: 9,
      holeOnePar: 5,
      tee: { name: "Blue", holeOneYardage: 480 },
    });

    await page.goto("/dashboard");
    await page.getByRole("link", { name: /start round/i }).click();
    await expect(page).toHaveURL(/\/rounds\/new$/);

    await page.getByRole("radio", { name: /round club/i }).click();
    await page.getByRole("radio", { name: "Blue" }).click();
    await page.getByRole("button", { name: /start round/i }).click();

    await expect(page).toHaveURL(/\/rounds\/[0-9a-f-]+\/play$/);
    await expect(page.getByText("Round Club · Blue")).toBeVisible();
    await expect(page.getByRole("heading", { name: /hole 1 of 9/i })).toBeVisible();

    // Hole 1 was snapshotted as a par 5 at 480 yards.
    await expect(page.getByText("Par 5 · 480 yd")).toBeVisible();

    // Dashboard offers to resume it.
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /resume round/i })).toBeVisible();
    await expect(page.getByText(/round club · blue — hole 1 of 9/i)).toBeVisible();
    await page.getByRole("link", { name: /^resume$/i }).click();
    await expect(page).toHaveURL(/\/rounds\/[0-9a-f-]+\/play$/);
  });
});
