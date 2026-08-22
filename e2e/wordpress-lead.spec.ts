import { test, expect } from '@playwright/test';
import request from 'supertest';

test.describe('WordPress Lead Injection', () => {
    test('POST to /api/external/lead with valid API key creates a booking', async ({ request: apiRequest }) => {
        const response = await apiRequest.post('http://127.0.0.1:5000/api/external/lead', { // Assuming backend port is 5000 for test
            headers: {
                'x-api-key': process.env.EXTERNAL_API_KEY || 'crm-wp-integration-2026'
            },
            data: {
                raw_fields: [
                    { key: 'name_1',      label: 'Name',      value: 'WP E2E Lead' },
                    { key: 'email_2',     label: 'Email',     value: 'wp@lead.com' },
                    { key: 'phone_3',     label: 'Phone',     value: '+19999999999' },
                    { key: 'from_4',      label: 'From',      value: 'LAX' },
                    { key: 'to_5',        label: 'To',        value: 'JFK' },
                    { key: 'departure_6', label: 'Departure', value: '2026-10-10' },
                    { key: 'adult_7',     label: 'Adult',     value: '2' },
                    { key: 'child_8',     label: 'Child',     value: '1' }
                ]
            }
        });
        
        // Verify response
        expect(response.status()).toBe(201);
        const body = await response.json();
        expect(body.uniqueCode).toMatch(/^TW\d+$/);
    });

    test('The new booking appears in the admin dashboard', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@travel.com');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL('/');

        await page.goto('/bookings');
        
        // Should find "WP E2E Lead"
        await expect(page.locator('td:has-text("WP E2E Lead")').first()).toBeVisible();

        // Booking type shows "B2C" for direct leads
        await page.locator('td:has-text("WP E2E Lead")').click();
        await expect(page.locator('text=B2C')).toBeVisible();
    });
});
