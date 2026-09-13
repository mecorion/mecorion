import {test, expect} from '@playwright/test';

const routes = [
  '/', '/sign-in', '/sign-up', '/dashboard', '/spaces', '/space/books',
  '/space/books/publication/author-a-selected', '/books', '/profile',
  '/settings', '/music', '/video', '/course', '/ui-kit',
];

for (const path of routes) {
  test(`direct URL ${path}`, async ({page}) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.text().includes('[Vue warn]')) errors.push(message.text());
    });
    const response = await page.goto(path);
    expect(response.status()).toBe(200);
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).toHaveURL(path);
    await expect(page.locator('.mcrn-sidebar')).toHaveCount(path === '/' || path.startsWith('/sign-') ? 0 : 1);
    await expect(page.locator('#mecorion-ui-library')).toHaveCount(1);
    expect(errors).toEqual([]);
  });
}

test('client navigation keeps the workspace and changes service menus', async ({page}) => {
  await page.goto('/dashboard');
  const sidebar = page.locator('.mcrn-sidebar');
  await expect(sidebar).toBeVisible();
  await sidebar.evaluate(element => element.dataset.smokeIdentity = 'original');
  await sidebar.getByRole('link', {name: 'Music', exact: true}).click();
  await expect(page).toHaveURL('/music');
  await expect(sidebar.getByRole('button', {name: 'Локальная музыка'})).toBeVisible();
  await expect(sidebar).toHaveAttribute('data-smoke-identity', 'original');
  await sidebar.getByRole('link', {name: 'Все сервисы'}).click();
  await expect(page).toHaveURL('/dashboard');
  await expect(sidebar.getByRole('link', {name: 'Video', exact: true})).toBeVisible();
  await expect(sidebar).toHaveAttribute('data-smoke-identity', 'original');
});

test('UI version and theme survive a reload', async ({page}) => {
  await page.goto('/settings');
  await page.locator('input[value="v2"]').check();
  await expect(page.locator('html')).toHaveAttribute('data-ui-version', 'v2');
  const initialDark = await page.locator('html').evaluate(element => element.classList.contains('dark'));
  await page.getByRole('button', {name: 'Переключить тему'}).click();
  const theme = initialDark ? 'light' : 'dark';
  await expect(page.locator('html')).toHaveClass(new RegExp(theme));
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-ui-version', 'v2');
  await expect(page.locator('html')).toHaveClass(new RegExp(theme));
  await expect(page.locator('input[value="v2"]')).toBeChecked();
});

test('SVG sprite is registered', async ({page}) => {
  await page.goto('/ui-kit');
  await expect(page.locator('#icon-mc-vpn-outline-shield')).toHaveCount(1);
  await expect(page.locator('#icon-mc-vpn-outline-shield path').first()).toBeAttached();
});

test('auth uses runtime API URL and preserves redirect', async ({page}) => {
  let body;
  await page.route('http://127.0.0.1:4017/api/v1/auth/sign-in', async route => {
    body = route.request().postDataJSON();
    await route.fulfill({json: {token: 'smoke-token', user: {id: 'smoke-user'}}});
  });
  await page.goto('/sign-in?redirect=/music');
  await page.getByPlaceholder('hello@mecorion.com').fill('smoke@example.com');
  await page.getByPlaceholder('Введите пароль').fill('smoke-password');
  await page.getByRole('button', {name: 'Войти', exact: true}).click();
  await expect(page).toHaveURL('/music');
  await expect(page.locator('.mcrn-sidebar')).toHaveCount(1);
  expect(body).toEqual({email: 'smoke@example.com', password: 'smoke-password'});
});
