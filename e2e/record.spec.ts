import { test, expect } from "@playwright/test";
import {
  createCourse,
  recordHole,
  signUpAndOnboard,
  supabaseConfigured,
} from "./helpers";

test.describe("record a round", () => {
  test.skip(!supabaseConfigured, "needs a Supabase test project");
  // Recording every hole is a lot of taps — give these room.
  test.describe.configure({ timeout: 120_000 });

  test("record 9 holes, finish, see the post-round analysis", async ({ page }) => {
    await signUpAndOnboard(page, "record");
    await createCourse(page, { name: "Record CC", holeCount: 9 });

    await page.goto("/rounds/new");
    await page.getByRole("radio", { name: /record cc/i }).click();
    await page.getByRole("button", { name: /start round/i }).click();
    await expect(page).toHaveURL(/\/rounds\/[0-9a-f-]+\/play$/);

    // 7 pars, a penalty double on hole 3, a 3-putt double on hole 5. Total 40 (+4).
    for (let holeNumber = 1; holeNumber <= 9; holeNumber += 1) {
      await expect(
        page.getByRole("heading", { name: new RegExp(`hole ${holeNumber} of 9`, "i") }),
      ).toBeVisible();
      if (holeNumber === 3) {
        await recordHole(page, { score: 6, shotsToZone: 3, putts: 2, penalty: 1 });
      } else if (holeNumber === 5) {
        await recordHole(page, {
          score: 6,
          shotsToZone: 2,
          putts: 3,
          bunker: { shots: 3, visited: 1 },
          mistakes: ["Strategy", "Short game"],
        });
      } else if (holeNumber === 7) {
        await recordHole(page, {
          score: 4,
          shotsToZone: 2,
          putts: 2,
          teeOutcome: "Recovery",
          teeLie: "Trees / other",
          approach: { result: "Missed", miss: "Right" },
        });
      } else {
        await recordHole(page, {
          score: 4,
          shotsToZone: 2,
          putts: 2,
          approach: { result: "Green" },
        });
      }
      await page.getByRole("button", { name: /save (& next|hole)/i }).click();
    }

    await expect(page.getByText(/recorded/i)).toBeVisible();
    await page.getByRole("button", { name: /finish 9-hole round/i }).click();
    await expect(page).toHaveURL(/\/rounds\/[0-9a-f-]+\/summary$/);

    // Score + benchmark scorecard.
    await expect(page.getByText("40", { exact: true })).toBeVisible();
    await expect(page.getByText("Played 9")).toBeVisible();
    await expect(page.getByText(/entered in regulation/i)).toBeVisible();
    await expect(page.getByText(/got down in three/i)).toBeVisible();
    await expect(page.getByText(/where shots leaked/i)).toBeVisible();

    // Shots to Get Back = 1 penalty (h3) + 1 putting (h5) + 2 bunker (h5, stuck).
    const stgb = page.getByRole("heading", { name: "Shots to get back" }).locator("..");
    await expect(stgb).toContainText("1 penalty · 1 putting · 2 bunker");

    // "Mistakes & bunkers" card.
    const faults = page.getByRole("heading", { name: "Mistakes & bunkers" }).locator("..");
    await expect(faults).toContainText("1 short game · 1 strategy");
    await expect(faults).toContainText("In a bunker on 1 hole (5)");
    await expect(faults).toContainText("needed 2+ to escape on 5");

    // "Off the tee" — one recovery recorded on hole 7.
    const tee = page.getByRole("heading", { name: "Off the tee" }).locator("..");
    await expect(tee).toContainText("needed a recovery");
    await expect(tee).toContainText("hole 7");

    // "Approach play" — 6 greens, 1 missed right (holes 3 and 5 logged no approach).
    const approach = page
      .getByRole("heading", { name: "Approach play" })
      .locator("..");
    await expect(approach).toContainText("6/7 found the green or zone");
    await expect(approach).toContainText("1 right");

    // "This round" — the category-priority lead line + event-count observations.
    await expect(
      page.getByText(/this round, your .+ leaked the most — about/i),
    ).toBeVisible();
    await expect(page.getByText(/1 penalty stroke on hole 3/i)).toBeVisible();
    await expect(page.getByText(/3 or more putts \(5\)/i)).toBeVisible();

    // Your game tier is locked (first completed round).
    await expect(
      page.getByText(/unlocks after about 3 rounds — 2 to go/i),
    ).toBeVisible();
  });

  test("returning to a recorded hole shows the editable form, not a summary", async ({
    page,
  }) => {
    await signUpAndOnboard(page, "reedit");
    await createCourse(page, { name: "Reedit CC", holeCount: 9 });

    await page.goto("/rounds/new");
    await page.getByRole("radio", { name: /reedit cc/i }).click();
    await page.getByRole("button", { name: /start round/i }).click();

    await recordHole(page, { score: 4, shotsToZone: 2, putts: 2 });
    await page.getByRole("button", { name: /save & next/i }).click();
    await expect(page.getByRole("heading", { name: /hole 2 of 9/i })).toBeVisible();

    // Jump back to hole 1 — straight into the form with its values, no Edit button.
    await page.getByRole("button", { name: /^1/ }).first().click();
    await expect(page.getByText(/recorded/i)).toBeVisible();
    await expect(page.getByRole("group", { name: "Score" })).toHaveText(/4/);
    await expect(
      page.getByRole("button", { name: /edit hole/i }),
    ).toHaveCount(0);

    // Bump the score straight away; it autosaves.
    await page.getByRole("button", { name: /increase score/i }).click();
    await expect(page.getByRole("group", { name: "Score" })).toHaveText(/5/);
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
    await page.getByRole("button", { name: /save & next/i }).click();

    await page.getByRole("button", { name: "9" }).click();
    await expect(
      page.getByRole("heading", { name: /hole 9 of 9/i }),
    ).toBeVisible();
    await page.getByRole("button", { name: /finish 9-hole round/i }).click();
    await expect(page.getByText(/holes? still need recording/i)).toBeVisible();
  });
});
