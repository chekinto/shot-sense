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

/**
 * Add a coarse historical round via /rounds/backfill. Grid defaults to 9 clean
 * pars; `holeOne` overrides hole 1's cells to make the round distinct.
 */
export const backfillRound = async (
  page: Page,
  opts: {
    courseName: string;
    holeOne?: { score?: number; putts?: number };
  },
): Promise<void> => {
  await page.goto("/rounds/backfill");
  await page.getByLabel("Course").fill(opts.courseName);
  await page.getByRole("radiogroup", { name: "Holes" }).getByRole("radio", { name: "9" }).click();

  if (opts.holeOne?.score !== undefined) {
    await page.getByLabel("Hole 1 score").fill(String(opts.holeOne.score));
  }
  if (opts.holeOne?.putts !== undefined) {
    await page.getByLabel("Hole 1 putts").fill(String(opts.holeOne.putts));
  }

  await page.getByRole("button", { name: /save round/i }).click();
  await expect(page).toHaveURL(/\/rounds\/[0-9a-f-]+\/summary$/);
};

/** Fill in the current hole's steppers on the play screen. */
export const recordHole = async (
  page: Page,
  values: {
    score: number;
    shotsToZone: number;
    putts: number;
    penalty?: number;
    teeOutcome?: string;
    teeLie?: string;
    /** Records one approach attempt on this hole. */
    approach?: { result: string; miss?: string };
    bunker?: { shots: number; visited: number };
    /** Chip labels to tap in the mistakes group, e.g. ["Strategy"]. */
    mistakes?: string[];
  },
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

  const teeGroup = page.getByRole("radiogroup", { name: /off the tee/i });
  await teeGroup
    .getByRole("radio", { name: values.teeOutcome ?? "Clear" })
    .click();
  await page
    .getByRole("radiogroup", { name: /tee shot ended up/i })
    .getByRole("radio", { name: values.teeLie ?? "Fairway" })
    .click();

  if (values.approach) {
    await page.getByRole("button", { name: /\+ approach/i }).click();
    const resultGroup = page.getByRole("radiogroup", {
      name: /approach 1 result/i,
    });
    await resultGroup.getByRole("radio", { name: values.approach.result }).click();
    if (values.approach.miss) {
      await page
        .getByRole("radiogroup", { name: /approach 1 miss direction/i })
        .getByRole("radio", { name: values.approach.miss })
        .click();
    }
  }

  if (values.bunker) {
    await page.getByRole("button", { name: /\+ bunker/i }).click();
    await bump(page, /increase bunker shots/i, values.bunker.shots);
    // Bunkers visited defaults to 1 once there are shots; bump up to the target.
    await bump(page, /increase bunkers visited/i, values.bunker.visited - 1);
  }

  if (values.mistakes) {
    await page.getByRole("button", { name: /\+ mistake/i }).click();
    const group = page.getByRole("group", { name: /mistakes/i });
    for (const label of values.mistakes) {
      await group.getByRole("button", { name: label }).click();
    }
  }

  if (values.penalty) {
    // Default tee outcome is "Clear", so the penalty stepper starts hidden.
    await page.getByRole("button", { name: /\+ penalty/i }).click();
    await bump(page, /increase penalty strokes/i, values.penalty);
  }
};
