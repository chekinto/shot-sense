import { test, expect } from "@playwright/test";

const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

test.describe("route guards (no auth backend needed)", () => {
  test("signed-out visit to /dashboard redirects to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("signed-out visit to a deeper protected route keeps a next param", async ({
    page,
  }) => {
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/login\?next=%2Fonboarding$/);
  });
});

test.describe("auth journey", () => {
  test.skip(
    !supabaseConfigured,
    "Set NEXT_PUBLIC_SUPABASE_URL (+ a test project) to run the full journey",
  );

  test("sign up, onboard, sign out, sign back in", async ({ page }) => {
    const email = `e2e+${Date.now()}@shotsense.test`;
    const password = "test-password-123";

    await page.goto("/signup");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /create account/i }).click();

    // With email confirmation disabled on the test project this lands on onboarding.
    await expect(page).toHaveURL(/\/onboarding$/);
    await page.getByLabel("Handicap").fill("15.2");
    await page.getByRole("button", { name: /continue/i }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", { name: /start a round/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /finish setting up/i }),
    ).toHaveCount(0);

    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /log in/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
