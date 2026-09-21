import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(
    page.getByRole('heading', { name: 'einsum visualization' }),
  ).toBeVisible();
  await expect(page.locator('[data-editor-ready="true"]')).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    page.getByRole('navigation', { name: 'Einsum examples' }),
  ).toBeVisible();
});

test('loads the visualizer shell', async ({ page }) => {
  const failures: string[] = [];
  page.on('response', (response) => {
    if (response.status() >= 400) {
      failures.push(`${response.status()} ${response.url()}`);
    }
  });

  await expect(page).toHaveURL(/\/einsum3d\/$/);
  await expect(page.locator('canvas')).toHaveCount(1);
  expect(
    failures.filter(
      (failure) => failure.includes('/_next/') || failure.includes('/fonts/'),
    ),
  ).toEqual([]);
});

test('switches presets and validates equations', async ({ page }) => {
  await page.getByRole('button', { name: 'Dot product' }).click();
  await expect(page.getByLabel('Einsum equation')).toHaveValue('i,i->');

  await page.getByLabel('Einsum equation').fill('i,j->k');
  await expect(
    page.getByRole('region', { name: 'Einsum inputs' }).getByRole('alert'),
  ).toBeVisible();

  await page.getByLabel('Einsum equation').fill('i,i->');
  await expect(
    page.getByRole('region', { name: 'Einsum inputs' }).getByRole('alert'),
  ).toHaveCount(0);
});

test('probes for a WebGL2 context', async ({ page }) => {
  const webgl2 = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2'));
  });
  test.info().annotations.push({
    type: 'webgl2',
    description: webgl2 ? 'available' : 'unavailable in this runner',
  });
  expect(typeof webgl2).toBe('boolean');
});
