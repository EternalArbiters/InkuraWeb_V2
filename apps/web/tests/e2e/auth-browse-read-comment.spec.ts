import { expect, test } from "@playwright/test";

import { signInAsSeedAdmin, uniqueE2ELabel } from "./helpers/auth";

test("seed admin can sign in, read seeded work, and post a comment thread", async ({ page }) => {
  const commentText = uniqueE2ELabel('comment');
  const replyText = uniqueE2ELabel('reply');

  await signInAsSeedAdmin(page);

  await page.goto('/browse/recent-updates');
  await expect(page.getByText('Benara: Great Sin of InSys Lab')).toBeVisible();
  await page.getByText('Benara: Great Sin of InSys Lab').first().click();

  await expect(page.getByRole('heading', { name: /Benara: Great Sin of InSys Lab/i })).toBeVisible();
  await page.getByRole('link', { name: /Chapter 1/i }).first().click();

  await expect(page.getByText('Welcome to Inkura.')).toBeVisible();

  await page.getByPlaceholder('Write a comment...').fill(commentText);
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByText(commentText)).toBeVisible();

  await page.getByRole('button', { name: 'Reply' }).first().click();
  await page.getByPlaceholder('Write a reply...').fill(replyText);
  await page.getByRole('button', { name: 'Send reply' }).click();
  await expect(page.getByText(replyText)).toBeVisible();
});
