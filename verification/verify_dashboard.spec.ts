import { test, expect } from '@playwright/test';

test('Dashboard Overview Verification', async ({ page }) => {
    // Mock the API response
    await page.route('**/api/v2/dashboard/overview*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalProjects: 15,
          activeProjects: 8,
          totalBeneficiaries: 5000,
          coveredProvinces: ['Kabul', 'Balkh', 'Herat'],
          sectors: {
            'Health': {
                projects: 5,
                beneficiaries: {
                    direct: { childrenGirls: 100 },
                    indirect: { childrenGirls: 50 },
                    include: { childrenGirls: true }
                },
                provinces: ['Kabul'],
                start: '2024-01-01',
                end: '2024-12-31',
                fieldActivity: 'Vaccination',
                staff: 20
            },
            'Education': {
                projects: 3,
                beneficiaries: {
                    direct: { childrenBoys: 200 },
                    indirect: {},
                    include: { childrenBoys: true }
                },
                provinces: ['Balkh'],
                start: '2024-01-01',
                end: '2025-01-01',
                fieldActivity: 'School building',
                staff: 15
            }
          },
          projectStatusCounts: { active: 8, ongoing: 5, completed: 2 }
        }),
      });
    });

    await page.goto('/public-dashboard-v2');

    // Wait for content to load
    await expect(page.getByText('Total Projects')).toBeVisible();
    await expect(page.getByText('5,000')).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: 'verification/dashboard-overview.png', fullPage: true });
});
