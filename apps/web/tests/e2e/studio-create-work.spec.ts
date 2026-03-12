import { expect, test } from "@playwright/test";

import { signInAsSeedAdmin, uniqueE2ELabel } from "./helpers/auth";

const coverPath = new URL('../fixtures/cover.png', import.meta.url).pathname;

test("seed admin can create a new work from studio", async ({ page }) => {
  const title = uniqueE2ELabel('stage9-work');

  await signInAsSeedAdmin(page);
  await page.goto('/studio/new');

  await page.getByPlaceholder('Work Title').fill(title);
  await page.getByPlaceholder('Short synopsis...').fill('Created by the stage 9 Playwright smoke suite.');
  await page.locator('input[type="file"]').first().setInputFiles(coverPath);
  await page.getByRole('button', { name: 'Create' }).click();

  await page.waitForURL(/\/studio\/works\/[A-Za-z0-9]+/);
  await expect(page.getByText(title)).toBeVisible();
});
