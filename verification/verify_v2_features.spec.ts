import { test, expect } from '@playwright/test';

test.describe('V2 Dashboard Functionality', () => {

  test('Login Button Redirect', async ({ page }) => {
    await page.goto('/');
    const loginButton = page.getByRole('link', { name: 'Log In' });
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toHaveAttribute('href', '/login');
  });

  test('Projects Section Renders', async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    page.on('pageerror', err => console.log(`BROWSER ERROR: ${err.message}`));

    // Log all requests
    await page.route('**', async (route) => {
        console.log(`REQUEST: ${route.request().url()}`);
        await route.continue();
    });

    // Mock Filter & Session APIs to prevent network delays/errors
    await page.route('**/api/v2/dashboard/filters', async (route) => {
        await route.fulfill({ status: 200, body: JSON.stringify({ years: [], provinces: [] }) });
    });
    await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({ status: 200, body: JSON.stringify({}) });
    });

    // Mock Projects API
    await page.route(/.*\/api\/v2\/dashboard\/projects.*/, async (route) => {
        console.log('Mock hit for projects API');
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                {
                    id: '1',
                    code: 'PRJ-001',
                    name: 'Test Project Alpha',
                    sector: 'Health',
                    status: 'Active',
                    provinces: ['Kabul'],
                    startDate: '2024-01-01',
                    endDate: '2024-12-31'
                }
            ])
        });
    });

    await page.goto('/');

    // Click on Projects sidebar item
    console.log('Clicking Projects button');
    await page.getByRole('button', { name: 'Projects' }).click();

    // Take debug screenshot
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'verification/debug_projects_fail.png' });

    // Verify table headers
    await expect(page.getByText('Project Title')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Code')).toBeVisible();

    // Verify Data
    await expect(page.getByText('Test Project Alpha')).toBeVisible();
    await expect(page.getByText('PRJ-001')).toBeVisible();
    await expect(page.getByText('Health')).toBeVisible();
  });

});
