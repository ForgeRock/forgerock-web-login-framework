/**
 * Playwright globalSetup for BrowserStack Local tunnel.
 *
 * Starts the BrowserStack Local binary so remote browsers can reach
 * 127.0.0.1 on the test runner (where mock AM + SvelteKit listen).
 *
 * In CI, the GitHub Action `browserstack/github-actions/setup-local`
 * manages the tunnel instead — this setup detects CI and skips.
 *
 * Returns a teardown function (Playwright 1.35+) that stops the tunnel.
 */
export default async function globalSetup(): Promise<(() => Promise<void>) | undefined> {
  if (process.env.CI) {
    console.log('[BrowserStack] CI detected — tunnel managed by GitHub Action, skipping.');
    return;
  }

  if (!process.env.BROWSERSTACK_ACCESS_KEY) {
    throw new Error(
      'BROWSERSTACK_ACCESS_KEY is required. Set it in your environment or .env file.',
    );
  }

  const { Local } = await import('browserstack-local');
  const bsLocal = new Local();

  await new Promise<void>((resolve, reject) => {
    bsLocal.start(
      {
        key: process.env.BROWSERSTACK_ACCESS_KEY,
        force: 'true',
      },
      (error?: Error) => (error ? reject(error) : resolve()),
    );
  });

  console.log('[BrowserStack] Local tunnel started.');

  return async () => {
    await new Promise<void>((resolve) => bsLocal.stop(() => resolve()));
    console.log('[BrowserStack] Local tunnel stopped.');
  };
}
