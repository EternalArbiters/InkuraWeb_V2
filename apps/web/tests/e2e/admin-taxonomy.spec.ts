import { expect, test } from "@playwright/test";

import { signInAsSeedAdmin, uniqueE2ELabel } from "./helpers/auth";

test("seed admin can create and find a custom taxonomy tag", async ({ page }) => {
  const name = uniqueE2ELabel('stage9-tag');
  const slug = name.toLowerCase();

  await signInAsSeedAdmin(page);
  await page.goto('/admin/taxonomy/tags');

  await expect(page.getByText('Tags')).toBeVisible();
  await page.getByRole('button', { name: 'Add' }).click();

  await page.getByPlaceholder('e.g. Manhwa').fill(name);
  await page.getByRole('button', { name: 'Save' }).click();

  await page.getByPlaceholder('Search name/slug…').fill(name);
  await expect(page.getByText(name)).toBeVisible();
  await expect(page.getByText(slug)).toBeVisible();
});
