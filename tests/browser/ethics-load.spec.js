const { test, expect } = require('@playwright/test');

const LOCAL_ORIGIN = 'http://127.0.0.1:4173';
test.use({
  baseURL: LOCAL_ORIGIN,
  serviceWorkers: 'block',
  screenshot: 'only-on-failure',
  trace: 'retain-on-failure'
});

test('ethics review page opens and input protection loads without real cloud access', async ({ page, context }, testInfo) => {
  const pageErrors = [];
  const mockedApiCalls = [];
  const blockedExternalRequests = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const part = type => parts.find(value => value.type === type).value;
  const dayKey = '__flove_welcome_v1:day:' + part('year') + '-' + part('month') + '-' + part('day');
  const mockCloud = Object.create(null);
  mockCloud[dayKey] = '1';

  await context.addInitScript(({ origin, dayKey }) => {
    if (location.origin === origin) localStorage.setItem(dayKey, '1');
  }, { origin: LOCAL_ORIGIN, dayKey });

  // The browser can fetch local review files only. Cloud API calls are fulfilled in memory.
  await context.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === LOCAL_ORIGIN && ['GET', 'HEAD'].includes(request.method())) {
      await route.continue();
      return;
    }
    if (['script.google.com', 'script.googleusercontent.com'].includes(url.hostname)) {
      mockedApiCalls.push(request.method());
      if (request.method() === 'POST') {
        let payload;
        try { payload = request.postDataJSON(); }
        catch (_) {
          await route.abort('blockedbyclient');
          throw new Error('Unexpected non-JSON mock cloud request');
        }
        if (!payload || payload.protocol !== 2 || !Array.isArray(payload.ops)) {
          await route.abort('blockedbyclient');
          throw new Error('Unexpected mock cloud protocol');
        }
        for (const operation of payload.ops) {
          if (operation.value === null) delete mockCloud[operation.key];
          else mockCloud[operation.key] = operation.value;
        }
      } else if (request.method() !== 'GET') {
        await route.abort('blockedbyclient');
        throw new Error('Unexpected mock cloud method');
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': LOCAL_ORIGIN },
        body: JSON.stringify({ protocol: 2, result: 'success', data: mockCloud })
      });
      return;
    }
    blockedExternalRequests.push(url.hostname);
    await route.abort('blockedbyclient');
  });

  await page.goto('/sang.html', { waitUntil: 'load' });
  await expect(page.locator('#noteForm')).toBeVisible();
  await expect(page.locator('#submitNoteButton')).toBeVisible();
  await expect.poll(() => page.evaluate(() => ({
    commonGuard: typeof window.FloveInputProtection?.create === 'function',
    ethicsGuard: !!window.FloveEthicsInput?.guard,
    bootstrapGuard: window.__floveEthicsBootstrapGuard === true,
    syncPendingApi: typeof window.FloveSync?.hasPendingInput === 'function'
  })), { timeout: 10000 }).toEqual({
    commonGuard: true, ethicsGuard: true, bootstrapGuard: true, syncPendingApi: true
  });

  const initialStorage = await page.evaluate(() => ({
    notes: localStorage.getItem('liv_ethic_notes_v11'),
    layout: localStorage.getItem('liv_ethic_layout_v11')
  }));
  expect(initialStorage).toEqual({ notes: null, layout: null });
  expect(pageErrors).toEqual([]);

  await page.screenshot({ path: testInfo.outputPath('ethics-startup.png'), fullPage: true });
  await testInfo.attach('startup-check', {
    body: Buffer.from(JSON.stringify({ initialStorage, pageErrors, mockedApiCalls, blockedExternalRequests }, null, 2)),
    contentType: 'application/json'
  });
});
