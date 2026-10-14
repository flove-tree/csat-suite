const { test, expect } = require('@playwright/test');

const LOCAL_ORIGIN = 'http://127.0.0.1:4173';
test.use({
  baseURL: LOCAL_ORIGIN,
  serviceWorkers: 'block',
  screenshot: 'only-on-failure',
  trace: 'retain-on-failure'
});

async function openReviewPage(page, context) {
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

  return { pageErrors, mockedApiCalls, blockedExternalRequests, mockCloud };
}

test('ethics review page opens and input protection loads without real cloud access', async ({ page, context }, testInfo) => {
  const { pageErrors, mockedApiCalls, blockedExternalRequests } = await openReviewPage(page, context);

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

test('typed ethics proposition and memo remain in a local draft without saving notes', async ({ page, context }, testInfo) => {
  const { pageErrors, mockedApiCalls, blockedExternalRequests, mockCloud } = await openReviewPage(page, context);
  const input = {
    unit: '생명 윤리',
    thinker: '칸트',
    original: '검증용 선지입니다.',
    memo: '검증용 메모입니다.'
  };

  await page.locator('#unitSelect').selectOption(input.unit);
  await page.locator('#thinker').fill(input.thinker);
  await page.locator('#originalText').fill(input.original);
  await page.locator('#memo').fill(input.memo);

  await expect.poll(() => page.evaluate(() => {
    const controller = window.FloveEthicsInput;
    if (!controller) return null;
    const draft = controller.guard.listDrafts().find(item => item.key === controller.guard.draftKey);
    if (!draft) return null;
    return {
      unit: draft.state.unit,
      thinker: draft.state.thinker,
      original: draft.state.original,
      memo: draft.state.memo,
      editingId: draft.context.editingId,
      dirty: controller.guard.hasUnsavedChanges()
    };
  }), { timeout: 5000 }).toEqual({ ...input, editingId: null, dirty: true });

  const confirmedStorage = await page.evaluate(() => ({
    notes: localStorage.getItem('liv_ethic_notes_v11'),
    layout: localStorage.getItem('liv_ethic_layout_v11')
  }));
  expect(confirmedStorage).toEqual({ notes: null, layout: null });
  expect(Object.keys(mockCloud).some(key => key.startsWith('liv_ethic_') || key.startsWith('__flove_input_draft_v1:'))).toBe(false);
  expect(pageErrors).toEqual([]);

  await page.screenshot({ path: testInfo.outputPath('ethics-local-draft.png'), fullPage: true });
  await testInfo.attach('local-draft-check', {
    body: Buffer.from(JSON.stringify({ input, confirmedStorage, pageErrors, mockedApiCalls, blockedExternalRequests }, null, 2)),
    contentType: 'application/json'
  });
});

test('local ethics draft can be restored after a page reload without saving notes', async ({ page, context }, testInfo) => {
  const { pageErrors, mockedApiCalls, blockedExternalRequests, mockCloud } = await openReviewPage(page, context);
  const input = {
    unit: '생명 윤리',
    thinker: '칸트',
    original: '새로고침 복원 검증용 선지.',
    memo: '새로고침 복원 검증용 메모.'
  };

  await page.locator('#unitSelect').selectOption(input.unit);
  await page.locator('#thinker').fill(input.thinker);
  await page.locator('#originalText').fill(input.original);
  await page.locator('#memo').fill(input.memo);
  const sourceDraftKey = await page.evaluate(() => window.FloveEthicsInput.guard.draftKey);
  await expect.poll(() => page.evaluate(key => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const state = JSON.parse(raw).state;
    return { unit: state.unit, thinker: state.thinker, original: state.original, memo: state.memo };
  }, sourceDraftKey), { timeout: 5000 }).toEqual(input);

  const reloadDialogTypes = [];
  const onReloadDialog = async dialog => {
    reloadDialogTypes.push(dialog.type());
    if (dialog.type() === 'beforeunload') await dialog.accept();
    else await dialog.dismiss();
  };
  page.on('dialog', onReloadDialog);
  try {
    await page.reload({ waitUntil: 'load' });
  } finally {
    page.off('dialog', onReloadDialog);
  }
  expect(reloadDialogTypes.every(type => type === 'beforeunload')).toBe(true);
  await expect.poll(() => page.evaluate(() => !!window.FloveEthicsInput?.guard), { timeout: 10000 }).toBe(true);
  expect(await page.evaluate(() => window.FloveEthicsInput.guard.draftKey)).not.toBe(sourceDraftKey);
  await expect(page.locator('#thinker')).toHaveValue('');
  await expect(page.locator('#originalText')).toHaveValue('');
  await expect(page.locator('#memo')).toHaveValue('');

  const panel = page.locator('#ethics-draft-panel');
  await expect(panel).toBeVisible();
  await panel.getByLabel('복원할 생윤 입력 초안').selectOption(sourceDraftKey);
  const restoreDialogTypes = [];
  const onRestoreDialog = async dialog => {
    restoreDialogTypes.push(dialog.type());
    if (dialog.type() === 'confirm') await dialog.accept();
    else await dialog.dismiss();
  };
  page.on('dialog', onRestoreDialog);
  try {
    await panel.getByRole('button', { name: '초안 복원', exact: true }).click();
  } finally {
    page.off('dialog', onRestoreDialog);
  }
  expect(restoreDialogTypes).toEqual(['confirm']);
  await expect(page.locator('#unitSelect')).toHaveValue(input.unit);
  await expect(page.locator('#thinker')).toHaveValue(input.thinker);
  await expect(page.locator('#originalText')).toHaveValue(input.original);
  await expect(page.locator('#memo')).toHaveValue(input.memo);
  expect(await page.evaluate(() => window.FloveEthicsInput.guard.hasUnsavedChanges())).toBe(true);

  const confirmedStorage = await page.evaluate(() => ({
    notes: localStorage.getItem('liv_ethic_notes_v11'),
    layout: localStorage.getItem('liv_ethic_layout_v11')
  }));
  expect(confirmedStorage).toEqual({ notes: null, layout: null });
  expect(await page.evaluate(key => localStorage.getItem(key) !== null, sourceDraftKey)).toBe(true);
  expect(Object.keys(mockCloud).some(key => key.startsWith('liv_ethic_') || key.startsWith('__flove_input_draft_v1:'))).toBe(false);
  expect(pageErrors).toEqual([]);

  await page.screenshot({ path: testInfo.outputPath('ethics-restored-draft.png'), fullPage: true });
  await testInfo.attach('restored-draft-check', {
    body: Buffer.from(JSON.stringify({ input, confirmedStorage, reloadDialogTypes, restoreDialogTypes, pageErrors, mockedApiCalls, blockedExternalRequests }, null, 2)),
    contentType: 'application/json'
  });
});

test('draft restore is blocked while newer ethics input is unsaved', async ({ page, context }, testInfo) => {
  const { pageErrors, mockedApiCalls, blockedExternalRequests, mockCloud } = await openReviewPage(page, context);
  const source = {
    unit: '생명 윤리',
    thinker: '칸트',
    original: '이전 초안 검증용 선지.',
    memo: '이전 초안 검증용 메모.'
  };
  const current = {
    unit: '국가와 시민의 윤리',
    thinker: '롤스',
    original: '현재 입력 유지 검증용 선지.',
    memo: '현재 입력 유지 검증용 메모.'
  };
  const readDraftState = key => page.evaluate(key => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const state = JSON.parse(raw).state;
    return { unit: state.unit, thinker: state.thinker, original: state.original, memo: state.memo };
  }, key);

  await page.locator('#unitSelect').selectOption(source.unit);
  await page.locator('#thinker').fill(source.thinker);
  await page.locator('#originalText').fill(source.original);
  await page.locator('#memo').fill(source.memo);
  const sourceDraftKey = await page.evaluate(() => window.FloveEthicsInput.guard.draftKey);
  await expect.poll(() => readDraftState(sourceDraftKey), { timeout: 5000 }).toEqual(source);

  const reloadDialogTypes = [];
  const onReloadDialog = async dialog => {
    reloadDialogTypes.push(dialog.type());
    if (dialog.type() === 'beforeunload') await dialog.accept();
    else await dialog.dismiss();
  };
  page.on('dialog', onReloadDialog);
  try {
    await page.reload({ waitUntil: 'load' });
  } finally {
    page.off('dialog', onReloadDialog);
  }
  expect(reloadDialogTypes.every(type => type === 'beforeunload')).toBe(true);
  await expect.poll(() => page.evaluate(() => !!window.FloveEthicsInput?.guard), { timeout: 10000 }).toBe(true);
  const currentDraftKey = await page.evaluate(() => window.FloveEthicsInput.guard.draftKey);
  expect(currentDraftKey).not.toBe(sourceDraftKey);

  const panel = page.locator('#ethics-draft-panel');
  await expect(panel).toBeVisible();
  await page.locator('#unitSelect').selectOption(current.unit);
  await page.locator('#thinker').fill(current.thinker);
  await page.locator('#originalText').fill(current.original);
  await page.locator('#memo').fill(current.memo);
  await expect.poll(() => readDraftState(currentDraftKey), { timeout: 5000 }).toEqual(current);
  await panel.getByLabel('복원할 생윤 입력 초안').selectOption(sourceDraftKey);

  // Reject any unexpected dialog, then fail the test if one appeared.
  const unexpectedRestoreDialogs = [];
  const rejectUnexpectedDialog = async dialog => {
    unexpectedRestoreDialogs.push(dialog.type());
    await dialog.dismiss();
  };
  page.on('dialog', rejectUnexpectedDialog);
  try {
    await panel.getByRole('button', { name: '초안 복원', exact: true }).click();
  } finally {
    page.off('dialog', rejectUnexpectedDialog);
  }
  expect(unexpectedRestoreDialogs).toEqual([]);
  await expect(panel.getByRole('status')).toHaveText('현재 입력을 먼저 저장하거나 수정 취소한 뒤 복원해 주세요.');
  await expect(page.locator('#unitSelect')).toHaveValue(current.unit);
  await expect(page.locator('#thinker')).toHaveValue(current.thinker);
  await expect(page.locator('#originalText')).toHaveValue(current.original);
  await expect(page.locator('#memo')).toHaveValue(current.memo);
  expect(await page.evaluate(() => window.FloveEthicsInput.guard.hasUnsavedChanges())).toBe(true);
  expect(await readDraftState(sourceDraftKey)).toEqual(source);
  await expect.poll(() => readDraftState(currentDraftKey), { timeout: 5000 }).toEqual(current);

  const confirmedStorage = await page.evaluate(() => ({
    notes: localStorage.getItem('liv_ethic_notes_v11'),
    layout: localStorage.getItem('liv_ethic_layout_v11')
  }));
  expect(confirmedStorage).toEqual({ notes: null, layout: null });
  expect(Object.keys(mockCloud).some(key => key.startsWith('liv_ethic_') || key.startsWith('__flove_input_draft_v1:'))).toBe(false);
  expect(pageErrors).toEqual([]);

  await page.screenshot({ path: testInfo.outputPath('ethics-restore-blocked.png'), fullPage: true });
  await testInfo.attach('blocked-restore-check', {
    body: Buffer.from(JSON.stringify({ source, current, confirmedStorage, reloadDialogTypes, unexpectedRestoreDialogs, pageErrors, mockedApiCalls, blockedExternalRequests }, null, 2)),
    contentType: 'application/json'
  });
});
