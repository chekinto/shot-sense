import { test, expect } from "@playwright/test";
import {
  createCourse,
  recordHole,
  signUpAndOnboard,
  supabaseConfigured,
} from "./helpers";

test.describe("offline round", () => {
  test.skip(!supabaseConfigured, "needs a Supabase test project");
  // The service worker only caches build assets under `next start`; `next dev`
  // chunks aren't cacheable, so the offline reload can't rehydrate. Run against
  // a production server (CI does; locally use RUN_OFFLINE_E2E=1 + `npm run start`).
  test.skip(
    !process.env.CI && !process.env.RUN_OFFLINE_E2E,
    "needs a production server — set RUN_OFFLINE_E2E=1",
  );
  test.describe.configure({ timeout: 120_000 });

  test("record while offline, survive a reload, then sync on reconnect", async ({
    page,
    context,
  }) => {
    await signUpAndOnboard(page, "offline");
    await createCourse(page, { name: "Offline CC", holeCount: 9 });

    await page.goto("/rounds/new");
    await page.getByRole("radio", { name: /offline cc/i }).click();
    await page.getByRole("button", { name: /start round/i }).click();
    await expect(page).toHaveURL(/\/rounds\/[0-9a-f-]+\/play$/);

    // Hole 1 online so the service worker caches the play route + its assets.
    await recordHole(page, { score: 4, shotsToZone: 2, putts: 2 });
    await page.getByRole("button", { name: /save & next/i }).click();
    await expect(page.getByRole("heading", { name: /hole 2 of 9/i })).toBeVisible();
    await page.waitForFunction(
      async () => Boolean((await navigator.serviceWorker.getRegistration())?.active),
      undefined,
      { timeout: 20_000 },
    );
    await page.reload();
    await expect(page.getByRole("heading", { name: /hole 2 of 9/i })).toBeVisible();

    // --- go offline ---
    await context.setOffline(true);
    await expect(page.getByText(/offline — your round is saved/i)).toBeVisible();

    for (const holeNumber of [2, 3, 4]) {
      await expect(
        page.getByRole("heading", { name: new RegExp(`hole ${holeNumber} of 9`, "i") }),
      ).toBeVisible();
      await recordHole(page, { score: 5, shotsToZone: 3, putts: 2 });
      await page.getByRole("button", { name: /save & next/i }).click();
    }
    await expect(page.getByRole("heading", { name: /hole 5 of 9/i })).toBeVisible();

    // --- reload while still offline: the round must survive and resume at hole 5 ---
    await page.reload();
    await expect(page.getByRole("heading", { name: /hole 5 of 9/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^2\s*5/ })).toBeVisible();

    // --- back online: the queue drains ---
    await context.setOffline(false);
    await expect(page.getByText(/offline — your round is saved/i)).toBeHidden();

    // Finish holes 5–9 online, then finish the round — which only succeeds if
    // the offline holes 2–4 reached the server.
    for (const holeNumber of [5, 6, 7, 8, 9]) {
      await expect(
        page.getByRole("heading", { name: new RegExp(`hole ${holeNumber} of 9`, "i") }),
      ).toBeVisible();
      await recordHole(page, { score: 4, shotsToZone: 2, putts: 2 });
      await page.getByRole("button", { name: /save (& next|hole)/i }).click();
    }

    await expect(page.getByText(/recorded/i)).toBeVisible();
    await page.getByRole("button", { name: /finish 9-hole round/i }).click();
    await expect(page).toHaveURL(/\/rounds\/[0-9a-f-]+\/summary$/);
    // 4 + (5·3) + (4·5) = 39
    await expect(page.getByText("39", { exact: true })).toBeVisible();
  });
});
