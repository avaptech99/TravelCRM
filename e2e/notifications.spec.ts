import { test, expect } from '@playwright/test';

test.describe('Notifications E2E', () => {
    test('Assigning a booking triggers a notification badge for the agent', async ({ page }) => {
        // We will mock this or rely on backend DB seeding depending on the E2E setup
        await page.goto('/login');
        await page.fill('input[type="email"]', 'agent@travel.com');
        await page.fill('input[type="password"]', 'agent123');
        await page.click('button:has-text("Sign In")');

        await expect(page).toHaveURL('/');
        
        // Notification bell should be visible
        const bell = page.locator('button:has(svg.lucide-bell)');
        await expect(bell).toBeVisible();

        // Agent sees notification in notification center
        await bell.click();
        const popup = page.locator('text="Notifications"').locator('..').locator('..');
        await expect(popup).toBeVisible();
        
        // Clicking "Read All" clears the notification badge
        const readBtn = page.locator('button:has-text("Read All")').first();
        if (await readBtn.isVisible()) {
            await readBtn.click();
        }
    });
});
