import { expect, type Page } from "@playwright/test";

export const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

/** Sign up a fresh user and complete onboarding, landing on the dashboard. */
export const signUpAndOnboard = async (
  page: Page,
  tag: string,
  handicap = "16",
): Promise<string> => {
  const email = `e2e+${tag}-${Date.now()}@shotsense.test`;
  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("test-password-123");
  await page.getByRole("button", { name: /create account/i }).click();

  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByLabel("Handicap").fill(handicap);
  await page.getByRole("button", { name: /continue/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  return email;
};

/** Create a course from the UI. Optionally set hole 1's par and add one tee. */
export const createCourse = async (
  page: Page,
  opts: {
    name: string;
    holeCount: 9 | 18;
    holeOnePar?: 3 | 4 | 5 | 6;
    tee?: { name: string; holeOneYardage: number };
  },
): Promise<void> => {
  await page.goto("/courses/new");
  await page.getByLabel("Course name").fill(opts.name);
  await page.getByRole("radio", { name: String(opts.holeCount) }).click();
  if (opts.holeOnePar) {
    await page
      .getByRole("radiogroup", { name: /par for hole 1$/i })
      .getByRole("radio", { name: String(opts.holeOnePar) })
      .click();
  }
  await page.getByRole("button", { name: /create course/i }).click();
  await expect(page).toHaveURL(/\/courses\/[0-9a-f-]+\/edit$/);

  if (opts.tee) {
    await page.getByLabel("Tee name").fill(opts.tee.name);
    await page
      .getByLabel("Yardage for hole 1")
      .fill(String(opts.tee.holeOneYardage));
    await page.getByRole("button", { name: /add tee/i }).click();
    await expect(
      page.getByRole("button", { name: new RegExp(`remove ${opts.tee.name}`, "i") }),
    ).toBeVisible();
  }
};

const bump = async (page: Page, label: RegExp, times: number) => {
  const button = page.getByRole("button", { name: label });
  for (let i = 0; i < times; i += 1) await button.click();
};

/** Fill in the current hole's steppers on the play screen. */
export const recordHole = async (
  page: Page,
  values: { score: number; shotsToZone: number; putts: number; penalty?: number },
): Promise<void> => {
  await bump(page, /increase score/i, values.score);
  await bump(
    page,
    /increase shots to reach inside 100 yds/i,
    values.shotsToZone + 1,
  );
  await bump(page, /increase putts/i, values.putts + 1);
  if (values.putts > 0) {
    await page.getByRole("radio", { name: /5–15/ }).click();
  }
  if (values.penalty) {
    await page.getByRole("button", { name: /\+ penalty/i }).click();
    await bump(page, /increase penalty strokes/i, values.penalty);
  }
};
