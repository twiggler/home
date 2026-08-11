// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const PORT = 4173;

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  outputDir: 'test-results',

  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
    // Reduce animation noise in the saved screenshots.
    launchOptions: { args: [] },
  },

  // Serve the static site so relative fetch() calls (cv-data.json) work over http.
  // Bind explicitly to 127.0.0.1 so the IPv4 health check below isn't missed
  // when "localhost" resolves to IPv6 (::1) inside the container.
  webServer: {
    command: `npx sirv . --host 127.0.0.1 --port ${PORT} --dev --quiet`,
    url: `http://127.0.0.1:${PORT}/index.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },

  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'desktop-firefox',  use: { ...devices['Desktop Firefox'], viewport: { width: 1280, height: 800 } } },
    { name: 'desktop-webkit',   use: { ...devices['Desktop Safari'],  viewport: { width: 1280, height: 800 } } },
    { name: 'mobile-iphone',    use: { ...devices['iPhone 13'] } },
    { name: 'mobile-pixel',     use: { ...devices['Pixel 5'] } },
  ],
});
