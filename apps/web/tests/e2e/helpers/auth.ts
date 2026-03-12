import { expect, Page } from "@playwright/test";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "noelephgoddess.game@gmail.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "admin123";

export async function signInAsSeedAdmin(page: Page) {
  await page.goto('/auth/signin');
  await page.getByPlaceholder('Email atau username').fill(ADMIN_EMAIL);
  await page.getByPlaceholder('Password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(/\/home(?:\?.*)?$/);
  await expect(page).toHaveURL(/\/home(?:\?.*)?$/);
}

export function uniqueE2ELabel(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
