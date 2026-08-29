import { test, expect } from "@playwright/test";

test("landing page renders the promise and CTAs", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /understand where your score is really going/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /start tracking your game/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /log in/i })).toBeVisible();
});

test("web app manifest is served", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.name).toBe("Shot Sense");
});
