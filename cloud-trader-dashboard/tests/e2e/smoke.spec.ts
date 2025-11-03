import { test, expect } from '@playwright/test';

test.describe('Sapphire Control Nexus dashboard', () => {
  test('renders hero, telemetry, and tabs', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /Sapphire AI Control Nexus/i })).toBeVisible();
    await expect(page.getByText(/Aster Labs Command Desk/i)).toBeVisible();

    await expect(page.getByRole('tab', { name: /Live Trading/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Positions/i })).toBeVisible();

    await expect(page.getByText(/Operational Telemetry/i)).toBeVisible();
    await expect(page.getByText(/Momentum Intelligence/i)).toBeVisible();
  });

  test('navigates between overview tabs', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: /Positions/i }).click();
    await expect(page.getByText(/Agent Exposure Monitor/i)).toBeVisible();

    await page.getByRole('tab', { name: /Performance/i }).click();
    await expect(page.getByText(/Momentum Performance Console/i)).toBeVisible();

    await page.getByRole('tab', { name: /System/i }).click();
    await expect(page.getByText(/Platform Resilience Console/i)).toBeVisible();
  });
});


