import { Page, expect } from '@playwright/test';

// Real login through the actual form -- no localStorage/token shortcuts.
export async function login(page: Page, email: string, password: string) {
    await page.goto('/login');
    await page.getByPlaceholder('user@travel.com').fill(email);
    await page.getByPlaceholder('Enter your password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText('Dashboard')).toBeVisible({ timeout: 10000 });
}

export async function logout(page: Page) {
    await page.getByRole('button', { name: /logout/i }).click();
    await expect(page).toHaveURL(/\/login/);
}
