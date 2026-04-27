import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/BioStack/i);
});

test('can search pubmed', async ({ page }) => {
  await page.goto('/');
  const searchInput = page.getByPlaceholder(/Enter biological terms or genes/i);
  await searchInput.fill('rhabdomyosarcoma');
  await searchInput.press('Enter');
  
  // Wait for results to appear
  await expect(page.locator('.citation-card')).first().toBeVisible({ timeout: 10000 });
});
