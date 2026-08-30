import { test, expect, type Page } from "@playwright/test";
import { createCourse, signUpAndOnboard, supabaseConfigured } from "./helpers";

const bump = async (page: Page, label: RegExp, times: number) => {
  const button = page.getByRole("button", { name: label });
  for (let i = 0; i < times; i += 1) await button.click();
};

const recordHole = async (
  page: Page,
  values: { score: number; shotsToZone: number; putts: number },
) => {
  await bump(page, /increase score/i, values.score);
  await bump(page, /increase shots to reach inside 100 yds/i, values.shotsToZone + 1);
  await bump(page, /increase putts/i, values.putts + 1);
  if (values.putts > 0) {
    await page.getByRole("radio", { name: /5–15/ }).click();
  }
};

test.describe("record a round", () => {
  test.skip(!supabaseConfigured, "needs a Supabase test project");

  test("record 9 holes, finish, see the score", async ({ page }) => {
    await signUpAndOnboard(page, "record");
    await createCourse(page, { name: "Record CC", holeCount: 9 });

    await page.goto("/rounds/new");
    await page.getByRole("radio", { name: /record cc/i }).click();
    await page.getByRole("button", { name: /start round/i }).click();
    await expect(page).toHaveURL(/\/rounds\/[0-9a-f-]+\/play$/);

    for (let holeNumber = 1; holeNumber <= 9; holeNumber += 1) {
      await expect(
        page.getByRole("heading", { name: new RegExp(`hole ${holeNumber} of 9`, "i") }),
      ).toBeVisible();
      await recordHole(page, { score: 4, shotsToZone: 2, putts: 2 });
      await page
        .getByRole("button", { name: /save (& next hole|hole)/i })
        .click();
    }

    // The final hole shows its saved summary once completeHole resolves.
    await expect(page.getByText(/score 4 · to zone 2/i)).toBeVisible();
    await page.getByRole("button", { name: /finish 9-hole round/i }).click();
    await expect(page).toHaveURL(/\/rounds\/[0-9a-f-]+\/summary$/);
    await expect(page.getByText("36", { exact: true })).toBeVisible();
    await expect(page.getByText(/level par/i)).toBeVisible();
  });

  test("finishing early lists the holes that still need recording", async ({
    page,
  }) => {
    await signUpAndOnboard(page, "partial");
    await createCourse(page, { name: "Partial CC", holeCount: 9 });

    await page.goto("/rounds/new");
    await page.getByRole("radio", { name: /partial cc/i }).click();
    await page.getByRole("button", { name: /start round/i }).click();

    // Record hole 1 only, then jump to the last hole and try to finish.
    await recordHole(page, { score: 4, shotsToZone: 2, putts: 2 });
    await page.getByRole("button", { name: /save & next hole/i }).click();

    await page.getByRole("button", { name: "9" }).click();
    await expect(
      page.getByRole("heading", { name: /hole 9 of 9/i }),
    ).toBeVisible();
    await page.getByRole("button", { name: /finish 9-hole round/i }).click();
    await expect(page.getByText(/holes? still need recording/i)).toBeVisible();
  });
});
