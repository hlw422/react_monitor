import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/auth/login');
  await expect(page).toHaveTitle(/Monitor/);
});

test('login form is visible', async ({ page }) => {
  await page.goto('/auth/login');
  await expect(page.locator('h1')).toContainText('Monitor');
  await expect(page.locator('input[id="username"]')).toBeVisible();
  await expect(page.locator('input[id="password"]')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeVisible();
});

test('can login with valid credentials', async ({ page }) => {
  await page.goto('/auth/login');
  await page.fill('input[id="username"]', 'admin');
  await page.fill('input[id="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard/);
});
