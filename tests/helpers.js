// Shared helpers for the Playwright specs.

// Keep the suite hermetic: block third-party requests (e.g. Google Fonts) so a
// slow or unreachable CDN can't stall page load and make the tests flaky.
export async function blockThirdParty(page) {
  await page.route('**/*', (route) => {
    const host = new URL(route.request().url()).hostname;
    return host === '127.0.0.1' || host === 'localhost'
      ? route.continue()
      : route.abort();
  });
}
