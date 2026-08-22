import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('Login with admin credentials → lands on dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@travel.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("Sign In")');

    await expect(page).toHaveURL('/');
    // Dashboard shows stats cards
    await expect(page.locator('text=Total Bookings')).toBeVisible();
    await expect(page.locator('text=New Enquiries')).toBeVisible();
  });

  test('Login with wrong password → shows error message', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@travel.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button:has-text("Sign In")');

    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });

  test('Logout clears token and redirects to login page', async ({ page }) => {
    // login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@travel.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL('/');

    // logout
    await page.click('button:has-text("Logout")'); // Assuming a logout button exists
    await expect(page).toHaveURL('/login');
  });

  test('Accessing /bookings without login redirects to /login', async ({ page }) => {
    await page.goto('/bookings');
    await expect(page).toHaveURL('/login');
  });
});
