import { expect, test, type Page } from '@playwright/test';

const CARDS = ['heart-rate', 'strain', 'sleep', 'dense'] as const;

/** Share of canvas pixels with non-zero alpha. */
function paintedFraction(page: Page) {
  return page.locator('#dense canvas').evaluate((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let painted = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] !== 0) painted++;
    return painted / (data.length / 4);
  });
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
});

test('renders every chart', async ({ page }, testInfo) => {
  await expect(
    page.getByRole('group', { name: 'Workout heart rate' }).locator('path').last(),
  ).toHaveAttribute('d', /^M/);
  await expect(
    page.getByRole('img', { name: 'Sleep stages, last night' }).locator('rect'),
  ).not.toHaveCount(0);
  await expect(page.getByRole('meter', { name: 'Strain' })).toHaveAttribute('aria-valuenow', /\d/);
  await expect(page.locator('#dense canvas')).toHaveAttribute('aria-label', /00:00 to 23:59/);

  for (const card of CARDS) {
    await testInfo.attach(card, {
      body: await page.locator(`#${card}`).screenshot(),
      contentType: 'image/png',
    });
  }
});

test('canvas draws non-blank pixels at device resolution', async ({ page }) => {
  const canvas = page.locator('#dense canvas');
  await expect(canvas).toBeVisible();
  const { backing, css, ratio } = await canvas.evaluate((el: HTMLCanvasElement) => ({
    backing: el.width,
    css: el.getBoundingClientRect().width,
    ratio: window.devicePixelRatio,
  }));
  expect(backing).toBe(Math.round(css * ratio));
  expect(await paintedFraction(page)).toBeGreaterThan(0.01);
});

test('canvas redraws at twice the resolution on a 2x screen', async ({ browser }) => {
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  await page.goto('/');
  const canvas = page.locator('#dense canvas');
  await expect(canvas).toBeVisible();
  const { backing, css } = await canvas.evaluate((el: HTMLCanvasElement) => ({
    backing: el.width,
    css: el.getBoundingClientRect().width,
  }));
  expect(backing).toBe(Math.round(css * 2));
  expect(await paintedFraction(page)).toBeGreaterThan(0.01);
  await page.close();
});

test('wheel zooms the canvas and the zoom presets update it', async ({ page }) => {
  const canvas = page.locator('#dense canvas');
  await canvas.hover();
  await page.mouse.wheel(0, -600);
  await expect(canvas).not.toHaveAttribute('aria-label', /00:00 to 23:59/);

  await page.getByRole('button', { name: 'Full day' }).click();
  await expect(canvas).toHaveAttribute('aria-label', /00:00 to 23:59/);
});

test('keyboard moves through heart rate readings', async ({ page }) => {
  const chart = page.getByRole('group', { name: 'Workout heart rate' });
  await chart.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#heart-rate [aria-live="polite"]')).toHaveText(/^07:00, \d+ bpm/);
});

test('screenshots for the README @docs', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 1000 });
  for (const theme of ['light', 'dark'] as const) {
    if (theme === 'dark') await page.getByRole('button', { name: 'Dark theme' }).click();
    for (const card of CARDS) {
      await page.locator(`#${card}`).screenshot({ path: `docs/${card}-${theme}.png` });
    }
  }
});
