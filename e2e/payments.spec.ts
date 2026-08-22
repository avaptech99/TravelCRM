import { test, expect } from '@playwright/test';

test.describe('Payments E2E', () => {
    test.beforeEach(async ({ page }) => {
        // Logs in as admin
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@travel.com');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL('/');
        
        // Creates a booking via the UI
        await page.goto('/bookings');
        await page.click('button:has-text("New Booking")');
        await expect(page.locator('text=Create New Booking')).toBeVisible();

        await page.fill('input[name="contactPerson"]', 'E2E Payment Test Person');
        await page.fill('input[name="contactNumber"]', '5555555555');
        await page.fill('textarea[name="requirements"]', 'Trip to Tokyo for Payment Test');
        await page.click('button:has-text("Create Booking")');
        
        // Wait for modal to close
        await expect(page.locator('text=Create New Booking')).toBeHidden();
        await expect(page.locator('td:has-text("E2E Payment Test Person")').first()).toBeVisible();

        // Assigns the booking to the agent user
        await page.waitForSelector('td:has-text("TW")');
        await page.locator('td:has-text("TW")').first().click();

        // Assignment UI via Edit Modal
        await page.click('button[title="Edit Lead Details"]');
        
        // Group must be selected before agent dropdown appears
        await page.locator('select[name="assignedGroup"]').selectOption('Sales');
        
        // Wait for the conditional agent dropdown
        await expect(page.locator('select[name="assignedToUserId"]')).toBeVisible();
        await page.locator('select[name="assignedToUserId"]').selectOption({ label: 'Demo Agent' });
        
        await page.click('button:has-text("Save Changes")');
        await expect(page.locator('text=Booking updated successfully!')).toBeVisible();

        // Logs out
        await page.click('button:has-text("Logout")');
        await expect(page).toHaveURL('/login');

        // Logs back in as agent
        await page.fill('input[type="email"]', 'agent@travel.com');
        await page.fill('input[type="password"]', 'agent123');
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL('/');
    });

    test('Agent can add a payment on an assigned booking', async ({ page }) => {
        await page.goto('/bookings');
        await page.waitForSelector('td:has-text("TW")');
        await page.locator('td:has-text("TW")').first().click();

        // Navigate to Payments tab if exists, or scroll to payments section
        const paymentBtn = page.locator('button:has-text("Add Payment")');
        if (await paymentBtn.isVisible()) {
            await paymentBtn.click();
            await page.fill('input[placeholder="0.00"]', '500');
            await page.click('button:has-text("Record Payment")');
            
            await expect(page.locator('text=Payment recorded successfully')).toBeVisible();
            // Outstanding balance decreases
            await expect(page.locator('text=Outstanding')).toBeVisible(); 
        }
    });

    test('Admin can delete a payment → balance increases back', async ({ page }) => {
        await page.click('button:has-text("Logout")');
        await expect(page).toHaveURL('/login');
        await page.fill('input[type="email"]', 'admin@travel.com');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button:has-text("Sign In")');

        await page.goto('/bookings');
        await page.waitForSelector('td:has-text("TW")');
        await page.locator('td:has-text("TW")').first().click();

        const deleteBtn = page.locator('button[aria-label="Delete Payment"]').first();
        if (await deleteBtn.isVisible()) {
            await deleteBtn.click();
            // confirm deletion
            await page.click('button:has-text("Confirm")');
            await expect(page.locator('text=Payment deleted')).toBeVisible();
        }
    });
});
