import { test, expect } from '@playwright/test';
import { blockThirdParty } from './helpers.js';

test.describe('cv', () => {
  test.beforeEach(async ({ page }) => {
    await blockThirdParty(page);
    await page.goto('/cv.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.site-header')).toBeVisible();
  });

  test('offers a PDF download via the Google Docs export endpoint', async ({ page }) => {
    const pdf = page.locator('.cv-toolbar a[download]');
    await expect(pdf).toBeVisible();
    await expect(pdf).toHaveAttribute('href', /\/export\?format=pdf$/);
  });
});
