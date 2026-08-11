// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const PAGES = [
  { name: 'index', path: '/index.html' },
  { name: 'cv', path: '/cv.html' },
  { name: 'projects', path: '/projects.html' },
];

// The index page opens behind a "Choose your experience" overlay; dismiss it
// so the page underneath is interactable and screenshot-worthy.
async function dismissStartOverlay(page) {
  const overlay = page.locator('#start-overlay');
  if (await overlay.count()) {
    await page.locator('#btn-muted').click();
    await overlay.waitFor({ state: 'detached', timeout: 5000 });
  }
}

for (const p of PAGES) {
  test.describe(p.name, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(p.path);
      await page.waitForLoadState('networkidle');
      if (p.name === 'index') await dismissStartOverlay(page);
    });

    test('has no horizontal overflow', async ({ page }) => {
      const overflow = await page.evaluate(() => {
        const el = document.documentElement;
        return el.scrollWidth - el.clientWidth;
      });
      expect(overflow).toBeLessThanOrEqual(1);
    });

    test('header and navigation are present', async ({ page }) => {
      await expect(page.locator('.site-header')).toBeVisible();
      await expect(page.locator('.site-nav a[href="index.html"]')).toHaveCount(1);
      await expect(page.locator('.site-nav a[href="cv.html"]')).toHaveCount(1);
      await expect(page.locator('.site-nav a[href="projects.html"]')).toHaveCount(1);
    });

    test('hamburger matches viewport', async ({ page }, testInfo) => {
      const width = page.viewportSize()?.width ?? 0;
      const hamburger = page.locator('.hamburger').first();
      if (width <= 650) {
        // Mobile: hamburger shows, inline nav is collapsed until toggled.
        await expect(hamburger).toBeVisible();
        await hamburger.click();
        await expect(page.locator('.site-nav.open')).toHaveCount(1);
      } else {
        // Desktop: hamburger hidden, nav shown inline.
        await expect(hamburger).toBeHidden();
        await expect(page.locator('.site-nav')).toBeVisible();
      }
    });

    test('capture screenshot', async ({ page }, testInfo) => {
      const file = path.join('screenshots', `${testInfo.project.name}-${p.name}.png`);
      await page.screenshot({ path: file, fullPage: false });
      await testInfo.attach(`${p.name}`, { path: file, contentType: 'image/png' });
    });
  });
}
