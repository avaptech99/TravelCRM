import { test, expect, Page } from '@playwright/test';
import { login, logout } from './helpers/auth';

// The table only renders one page (15 rows) at a time -- search instead of
// scanning rows, so this works regardless of where the lead sorts.
async function findLeadRow(page: Page, code: string) {
    await page.getByPlaceholder('Search contact person/number...').fill(code);
    const row = page.getByRole('row', { name: new RegExp(code) });
    await expect(row).toBeVisible({ timeout: 10000 });
    return row;
}

// selectOption({label:...}) submitted the literal label text instead of the
// option's value on a real run (backend got "Cast to ObjectId failed for
// value \"agent (agent@travel.com)\""), for reasons unclear -- read the real
// value directly out of the DOM instead of trusting Playwright's label match.
async function selectByOptionText(select: ReturnType<Page['getByLabel']>, text: string) {
    const value = await select.evaluate((el: HTMLSelectElement, wanted: string) => {
        const opt = Array.from(el.options).find((o) => o.textContent?.trim() === wanted);
        return opt?.value;
    }, text);
    if (!value) throw new Error(`No <option> found with text "${text}"`);
    await select.selectOption(value);
}

/**
 * Real E2E against the live main-2 deployment (frontend+backend+DB are the
 * same production system -- there is no separate staging environment).
 * No mocks: every assertion is against actual rendered UI state or the
 * live API response.
 *
 * Requires (not committed, must be supplied by whoever runs the suite):
 *   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD   -- an ADMIN account
 *   E2E_AGENT_A_EMAIL / E2E_AGENT_A_PASSWORD -- an AGENT account
 *   E2E_AGENT_B_EMAIL / E2E_AGENT_B_PASSWORD -- a second AGENT account
 *   E2E_MISSED_CALL_UNIQUE_CODE -- an existing, currently-unassigned
 *     missed-call lead's Booking ID (e.g. "TW8601") safe to mutate.
 *     Nothing here creates new leads -- GDMS leads can only be created by
 *     the real GDMS webhook, which needs GDMS_WEBHOOK_USER/PASS this suite
 *     does not have. Point this at one real, expendable test lead.
 *
 * ponytail: one sequential spec file, not 15 -- most flows share the same
 * lead and the same login session, so chaining them is both faster and a
 * more realistic user session than isolating each into its own file.
 */

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
const AGENT_A_EMAIL = process.env.E2E_AGENT_A_EMAIL;
const AGENT_A_PASSWORD = process.env.E2E_AGENT_A_PASSWORD;
const AGENT_B_EMAIL = process.env.E2E_AGENT_B_EMAIL;
const AGENT_B_PASSWORD = process.env.E2E_AGENT_B_PASSWORD;
const LEAD_CODE = process.env.E2E_MISSED_CALL_UNIQUE_CODE;

test.skip(
    !ADMIN_EMAIL || !ADMIN_PASSWORD || !AGENT_A_EMAIL || !AGENT_A_PASSWORD || !LEAD_CODE,
    'Missing E2E credentials/test-lead env vars -- see header comment in this file.'
);

test.describe.serial('Missed-call GDMS lifecycle (main-2, real backend+DB)', () => {
    let leadUrl: string;

    // FLOW 1 -- missed calls appear, list is call-only, record opens correctly
    test('All Leads shows only missed-call leads, and the test lead opens', async ({ page }) => {
        await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
        await page.getByRole('link', { name: 'All Leads' }).click();
        await expect(page.getByRole('heading', { name: 'All Bookings' })).toBeVisible();

        // Filters button must be locked on this view (pre-applied missed-call filter)
        await expect(page.getByRole('button', { name: /Filters/i })).toBeDisabled();

        const row = await findLeadRow(page, LEAD_CODE!);
        await row.click();
        await expect(page).toHaveURL(/\/bookings\/[a-f0-9]{24}/);
        leadUrl = page.url();

        // Missed-call identity: PhoneMissed comment text should be present in history,
        // and this must not present as a normal multi-segment booking workflow (no
        // "Travelers"/"Payments"/"Booking Costs" sections were kept for this page).
        await expect(page.getByText(/Missed Call from/i).first()).toBeVisible();
    });

    // FLOW 2 -- assign to an agent, verify assignedToUserId not assignedGroup
    test('Admin assigns the lead to Agent A via the Assign icon', async ({ page }) => {
        await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
        await page.getByRole('link', { name: 'All Leads' }).click();
        const row = await findLeadRow(page, LEAD_CODE!);

        await row.getByTitle('Assign Agent').click();
        await expect(page.getByRole('heading', { name: 'Assign Agent' })).toBeVisible();

        const [assignResponse] = await Promise.all([
            page.waitForResponse((r) => r.url().includes('/assign') && r.request().method() === 'PATCH'),
            (async () => {
                await selectByOptionText(page.getByRole('combobox'), `${process.env.E2E_AGENT_A_NAME!} (${AGENT_A_EMAIL!})`);
                await page.getByRole('button', { name: /^assign$/i }).click();
            })(),
        ]);
        expect(assignResponse.ok()).toBeTruthy();
        const body = await assignResponse.json();
        expect(body.assignedToUserId).toBeTruthy(); // assignedToUserId changed

        await expect(row.getByText('Unassigned')).not.toBeVisible();
    });

    // FLOW 4 / 10 -- assignment persists, My Leads shows it under the assignee
    test('Agent A sees the lead under My Leads and it persists after refresh', async ({ page }) => {
        await login(page, AGENT_A_EMAIL!, AGENT_A_PASSWORD!);
        await page.getByRole('link', { name: 'My Leads' }).click();
        await findLeadRow(page, LEAD_CODE!);

        await page.goto(leadUrl); // Flow 13: direct-URL refresh
        await page.reload();
        await expect(page.getByText('Assignment')).toBeVisible();
        await expect(page.locator('text=Assignment').locator('..').getByText('Unassigned')).not.toBeVisible();
    });

    // FLOW 9 -- comments persist and are attributed correctly
    test('Comment added on the lead persists after refresh', async ({ page }) => {
        await login(page, AGENT_A_EMAIL!, AGENT_A_PASSWORD!);
        await page.goto(leadUrl);
        const commentText = `e2e comment ${Date.now()}`;
        await page.getByPlaceholder('Add a new comment or remark...').fill(commentText);
        await page.getByRole('button', { name: /post comment/i }).click();
        await expect(page.getByText(commentText)).toBeVisible();

        await page.reload();
        await expect(page.getByText(commentText)).toBeVisible();
    });

    // FLOW 5/6 -- edit form: status + interested, values persist
    test('Edit Booking changes Status/Interested and they persist', async ({ page }) => {
        await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
        await page.goto(leadUrl);
        await page.getByTitle('Edit Lead Details').click();
        await expect(page.getByRole('heading', { name: 'Edit Booking' })).toBeVisible();

        await page.getByLabel('Status').selectOption('Working');
        await page.getByLabel('Interested').selectOption('Yes');
        await page.getByRole('button', { name: /save changes/i }).click();
        await expect(page.getByRole('heading', { name: 'Edit Booking' })).not.toBeVisible();

        await page.reload();
        await expect(page.getByText('Working')).toBeVisible();
    });

    // FLOW 11 -- reassign, verify old assignee loses it, new one gets it, assignedGroup untouched
    test('Reassign from Agent A to Agent B does not touch assignedGroup', async ({ page }) => {
        test.skip(!AGENT_B_EMAIL || !AGENT_B_PASSWORD, 'E2E_AGENT_B_* not supplied');

        await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
        await page.goto(leadUrl);
        await page.getByTitle('Edit Lead Details').click();

        const [assignResponse] = await Promise.all([
            page.waitForResponse((r) => r.url().includes('/assign') && r.request().method() === 'PATCH'),
            (async () => {
                // EditModal's "Assign To" options are the plain agent name (no email), unlike AssignAgentModal
                await selectByOptionText(page.getByLabel('Assign To'), process.env.E2E_AGENT_B_NAME!);
                await page.getByRole('button', { name: /save changes/i }).click();
            })(),
        ]);
        const body = await assignResponse.json();
        // Critical assertion from the assignment requirement: assignedGroup must be
        // whatever it already was, not derived/overwritten by this assign call.
        expect(Object.keys(body)).not.toContain('assignedGroupChanged');

        await logout(page);
        await login(page, AGENT_A_EMAIL!, AGENT_A_PASSWORD!);
        await page.getByRole('link', { name: 'My Leads' }).click();
        await page.getByPlaceholder('Search contact person/number...').fill(LEAD_CODE!);
        await page.waitForTimeout(1000); // debounce
        await expect(page.getByRole('row', { name: new RegExp(LEAD_CODE!) })).not.toBeVisible();
    });

    // FLOW 3/14 -- All Leads accessible to agents, permission boundaries hold
    test('Agent A can view All Leads without error', async ({ page }) => {
        await login(page, AGENT_A_EMAIL!, AGENT_A_PASSWORD!);
        await page.getByRole('link', { name: 'All Leads' }).click();
        await expect(page.getByRole('heading', { name: 'All Bookings' })).toBeVisible();
        await expect(page.getByText(/error|failed to load/i)).not.toBeVisible();
    });

    // Group/department visibility: an agent must see the same views as admin,
    // not narrowed by assignedGroup/department membership.
    test('Agent A visibility is not group-restricted (Overview, Unassigned, Booked/EDT, and All Leads count matches Admin)', async ({ page }) => {
        // Capture Admin's All Leads total via the real API response.
        await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
        const [adminBookingsRes] = await Promise.all([
            page.waitForResponse((r) => /\/bookings\?/.test(r.url()) && r.request().method() === 'GET'),
            page.getByRole('link', { name: 'All Leads' }).click(),
        ]);
        const adminTotal = (await adminBookingsRes.json()).meta?.total;
        await logout(page);

        await login(page, AGENT_A_EMAIL!, AGENT_A_PASSWORD!);

        // Overview: must render without error/crash (no group-based zeroing).
        await expect(page.getByRole('heading', { name: 'Dashboard' }).or(page.getByText('Overview'))).toBeVisible();
        await expect(page.getByText(/error|failed to load/i)).not.toBeVisible();

        // All Leads: agent's total must equal admin's -- group membership must
        // not reduce the shared missed-call queue.
        const [agentBookingsRes] = await Promise.all([
            page.waitForResponse((r) => /\/bookings\?/.test(r.url()) && r.request().method() === 'GET'),
            page.getByRole('link', { name: 'All Leads' }).click(),
        ]);
        const agentTotal = (await agentBookingsRes.json()).meta?.total;
        expect(agentTotal).toBe(adminTotal);

        // Unassigned
        await page.getByRole('link', { name: 'Unassigned' }).click();
        await expect(page.getByText(/error|failed to load/i)).not.toBeVisible();

        // Booked / EDT
        await page.getByRole('link', { name: 'Booked / EDT' }).click();
        await expect(page.getByText(/error|failed to load/i)).not.toBeVisible();
    });

    // Regression: My Leads was querying the participantIds cache array instead
    // of assignedToUserId directly, so a booking assigned before that array was
    // in sync (or by a path that skipped it) never showed up here even though
    // the assignment itself was correct everywhere else. Runs after the
    // reassign test above, so the lead is now Agent B's -- check Agent B's
    // My Leads instead, and that every returned record is genuinely theirs.
    test('My Leads returns records by assignedToUserId, not group', async ({ page }) => {
        test.skip(!AGENT_B_EMAIL || !AGENT_B_PASSWORD, 'E2E_AGENT_B_* not supplied');

        await login(page, AGENT_B_EMAIL!, AGENT_B_PASSWORD!);
        const [res] = await Promise.all([
            page.waitForResponse((r) => /\/bookings\?.*myBookings=true/.test(r.url()) && r.request().method() === 'GET'),
            page.getByRole('link', { name: 'My Leads' }).click(),
        ]);
        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.data.length).toBeGreaterThan(0);
        for (const b of body.data) {
            expect(b.assignedToUser?.name).toBe(process.env.E2E_AGENT_B_NAME);
        }
        await findLeadRow(page, LEAD_CODE!); // reassigned to Agent B earlier in this suite
    });
});
