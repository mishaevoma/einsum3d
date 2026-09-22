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
            (failure) =>
                failure.includes('/_next/') || failure.includes('/fonts/'),
        ),
    ).toEqual([]);
});

test('switches presets and validates equations', async ({ page }) => {
    await page.getByLabel('Choose an example').click();
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

test('renders with a WebGL2 context', async ({ page }) => {
    const webgl2 = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        return Boolean(canvas.getContext('webgl2'));
    });
    test.info().annotations.push({
        type: 'webgl2',
        description: webgl2 ? 'available' : 'unavailable in this runner',
    });
    expect(webgl2).toBe(true);
    await expect(
        page.getByRole('region', { name: /^3D canvas/ }),
    ).toBeVisible();
});

test('explores every example, dimensions, and camera controls', async ({
    page,
}) => {
    const examples = [
        ['Dot product', 'i,i->'],
        ['Transposed outer product', 'i,j->ji'],
        ['Return a diagonal', 'ii->i'],
        ['Batched matrix multiplication', 'Bik,Bkj->Bij'],
        ['Multihead query-key attention scores', 'Bnqh,Bnkh->Bnqk'],
        ['Quadratic form', 'a,ab,b->'],
        ['Custom', 'abcdefg,h->he'],
        ['Matrix multiplication', 'ik,kj->ij'],
    ];
    for (const [name, equation] of examples) {
        await page.getByLabel('Choose an example').click();
        await page.getByRole('button', { name, exact: true }).click();
        await expect(
            page.getByRole('heading', { name, exact: true }),
        ).toBeVisible();
        await expect(page.getByLabel('Einsum equation')).toHaveValue(equation);
        await expect(
            page
                .getByRole('region', { name: 'Einsum inputs' })
                .getByRole('alert'),
        ).toHaveCount(0);
    }
    await page
        .getByRole('button', { name: 'Inspect dimension k', exact: true })
        .click();
    await expect(
        page.getByRole('button', { name: 'Inspect dimension k', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText(/disappears from the output/)).toBeVisible();
    const canvas = page.getByRole('region', { name: /^3D canvas/ });
    await canvas.press('ArrowRight');
    await canvas.press('Shift+ArrowDown');
    await canvas.press('+');
    await canvas.press('f');
    for (const name of [
        'Front view',
        'Perspective view',
        'Zoom out',
        'Zoom in',
        'Fit visualization to view',
    ])
        await page.getByRole('button', { name, exact: true }).click();
    await expect(
        page.getByRole('region', { name: 'Einsum inputs' }).getByRole('alert'),
    ).toHaveCount(0);
});

test('edits shapes, resets an example, and switches code format', async ({
    page,
}) => {
    await page.getByLabel('Operand shape', { exact: true }).first().fill('4,8');
    await expect(
        page.getByRole('region', { name: 'Output tensor' }),
    ).toContainText('4 × 12');
    await page.getByLabel('Operand shape', { exact: true }).first().fill('4,0');
    await expect(
        page.getByRole('region', { name: 'Einsum inputs' }).getByRole('alert'),
    ).toBeVisible();
    await expect(
        page.getByText('Editing equation · showing your last valid preview'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Reset example' }).click();
    await expect(
        page.getByLabel('Operand shape', { exact: true }).first(),
    ).toHaveValue('[16,8]');
    await page.getByRole('button', { name: 'NumPy', exact: true }).click();
    await expect(
        page.getByRole('region', { name: 'Python equivalent' }),
    ).toContainText('np.einsum("ik,kj->ij", operand_1, operand_2)');
});

test('adapts to narrow screens and resizes without horizontal overflow', async ({
    page,
}) => {
    for (const width of [390, 768, 1440]) {
        await page.setViewportSize({ width, height: 844 });
        await expect(
            page.getByRole('heading', {
                name: 'Matrix multiplication',
                exact: true,
            }),
        ).toBeVisible();
        expect(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= window.innerWidth,
            ),
        ).toBe(true);
        await expect(page.getByLabel('Einsum equation')).toBeVisible();
    }
});

test('keeps the editor usable without WebGL2', async ({ page }) => {
    await page.addInitScript(() => {
        const getContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (
            this: HTMLCanvasElement,
            ...args: Parameters<typeof getContext>
        ) {
            if (args[0] === 'webgl2') return null;
            return getContext.apply(this, args);
        } as typeof getContext;
    });
    await page.reload();
    await expect(
        page.getByText('This application requires a WebGL2-capable browser.', {
            exact: false,
        }),
    ).toBeVisible();
    await page.getByLabel('Einsum equation').fill('ik,kj->ji');
    await expect(
        page.getByRole('region', { name: 'Output tensor' }),
    ).toContainText('12 × 16');
});
