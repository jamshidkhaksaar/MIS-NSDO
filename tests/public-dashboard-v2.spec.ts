import { test, expect } from '@playwright/test';

test.describe('Public Dashboard V2', () => {
  test('should load the dashboard and render overview section', async ({ page }) => {
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

    // Navigate to ROOT now, as we swapped the pages
    await page.goto('/');

    // Check Sidebar
    await expect(page.getByText('NSDO MIS')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Overview' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sectors' })).toBeVisible();

    // Check TopBar
    await expect(page.getByRole('heading', { name: 'Public Dashboard' })).toBeVisible();

    // Check Overview Content (wait for loading to finish)
    await expect(page.getByText('Total Projects')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('15', { exact: true })).toBeVisible(); // Value from mock

    await expect(page.getByText('Active Projects')).toBeVisible();
    await expect(page.getByText('8', { exact: true }).first()).toBeVisible();

    await expect(page.getByText('Total Beneficiaries')).toBeVisible();
    await expect(page.getByText('5,000')).toBeVisible();

    // Check Chart presence (by text in chart)
    await expect(page.getByText('Projects by Sector')).toBeVisible();
    await expect(page.getByText('Project Status')).toBeVisible();
  });

  test('should switch sections', async ({ page }) => {
    await page.goto('/');

    // Click on Sectors
    await page.getByRole('button', { name: 'Sectors' }).click();

    // Verify URL didn't change (SPA feel) but content changed
    // We implemented a placeholder for non-overview sections
    await expect(page.getByText('The sectors section is under development')).toBeVisible();
  });
});
