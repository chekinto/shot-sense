import { test, expect, type Page } from "@playwright/test";

const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

test("signed-out visit to /courses redirects to /login", async ({ page }) => {
  await page.goto("/courses");
  await expect(page).toHaveURL(/\/login\?next=%2Fcourses$/);
});

test.describe("course management", () => {
  test.skip(!supabaseConfigured, "needs a Supabase test project");

  const signUpAndOnboard = async (page: Page) => {
    const email = `e2e+course-${Date.now()}@shotsense.test`;
    await page.goto("/signup");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("test-password-123");
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/onboarding$/);
    await page.getByLabel("Handicap").fill("18");
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  };

  test("create, edit pars, add a tee, and reuse", async ({ page }) => {
    await signUpAndOnboard(page);

    await page.getByRole("link", { name: "Courses" }).click();
    await expect(page.getByText(/no courses yet/i)).toBeVisible();

    // Create a 9-hole course with hole 1 as a par 5.
    await page.getByRole("link", { name: /add course/i }).click();
    await page.getByLabel("Course name").fill("E2E Club");
    await page.getByRole("radio", { name: "9" }).click();
    const holeOne = page.getByRole("radiogroup", { name: /par for hole 1$/i });
    await holeOne.getByRole("radio", { name: "5" }).click();
    await page.getByRole("button", { name: /create course/i }).click();

    await expect(page).toHaveURL(/\/courses\/[0-9a-f-]+\/edit$/);
    await expect(page.getByRole("heading", { name: "E2E Club" })).toBeVisible();

    // Edit a par and save.
    const holeTwo = page.getByRole("radiogroup", { name: /par for hole 2$/i });
    await holeTwo.getByRole("radio", { name: "3" }).click();
    await page.getByRole("button", { name: /save changes/i }).click();
    await expect(page.getByText("Saved.").first()).toBeVisible();

    // Add a tee set with one yardage.
    await page.getByLabel("Tee name").fill("White");
    await page.getByLabel("Yardage for hole 1").fill("500");
    await page.getByRole("button", { name: /add tee/i }).click();
    await expect(
      page.getByRole("button", { name: /remove white/i }),
    ).toBeVisible();

    // The list reflects the saved course.
    await page.getByRole("link", { name: "Done" }).click();
    await expect(page).toHaveURL(/\/courses$/);
    await expect(page.getByText("E2E Club")).toBeVisible();
    await expect(page.getByText(/9 holes · 1 tee/)).toBeVisible();

    // Reopening shows persisted data. The saved tee renders first (an edit
    // form); an empty "add" form follows, so scope to the first of each.
    await page.getByText("E2E Club").click();
    await expect(
      page.getByRole("radiogroup", { name: /par for hole 1$/i }).getByRole("radio", {
        name: "5",
        checked: true,
      }),
    ).toBeVisible();
    await expect(page.getByLabel("Tee name").first()).toHaveValue("White");
    await expect(page.getByLabel("Yardage for hole 1").first()).toHaveValue("500");
  });
});
