import {test, expect} from '@playwright/test';

test.beforeEach(async ({page}) => {
  await page.route('**/api/v1/auth/me', route => route.fulfill({json: {user: {id: 'video-test', displayName: 'Video test', roles: ['ADMIN']}}}));
  await page.route('**/api/v1/platform/navigation', route => route.fulfill({json: {groups: [], allowedPageCodes: ['video']}}));
});

test('video links support direct entry, reload and browser history', async ({page}) => {
  await page.setViewportSize({width: 320, height: 768});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/video/library?category=Сериалы');
  await expect(page.getByRole('combobox', {name: 'Категория', exact: true})).toHaveText('Сериалы');
  const title = page.locator('.mevideo-media-grid .mevideo-media-card__title a').first();
  await expect(title).toHaveAttribute('href', '/video/video-series-01');
  await title.click();
  await expect(page).toHaveURL(/\/video\/video-series-01$/);
  await expect(page.locator('h1')).toHaveText('Сериал: пилотный выпуск');
  await page.reload();
  await expect(page.locator('h1')).toHaveText('Сериал: пилотный выпуск');
  await page.goBack();
  await expect(page.getByRole('combobox', {name: 'Категория', exact: true})).toHaveText('Сериалы');
  await page.goForward();
  await expect(page.locator('h1')).toHaveText('Сериал: пилотный выпуск');
  await page.locator('.mevideo-watch-view__aside').getByRole('link', {name: 'Сезон 2', exact: true}).click();
  await page.locator('.mevideo-episode-list a').filter({hasText: 'Эпизод 2'}).click();
  await expect(page).toHaveURL(/season=2&episode=video-series-01-s2-e2$/);
  await page.reload();
  await expect(page.locator('.mevideo-watch-view__episode')).toHaveText('Сезон 2 · Эпизод 2');
  await page.goBack();
  await expect(page.locator('.mevideo-watch-view__episode')).toHaveText('Сезон 2 · Эпизод 1');
  expect(errors).toEqual([]);
});

test('each catalog video has a distinct working URL', async ({page}) => {
  await page.goto('/video/library');
  await expect(page.locator('.mevideo-media-grid .mevideo-media-card__title a')).toHaveCount(6);
  const links = await page.locator('.mevideo-media-grid .mevideo-media-card__title a').evaluateAll(elements => elements.map(element => ({href: element.getAttribute('href'), title: element.textContent})));
  expect(new Set(links.map(link => link.href)).size).toBe(links.length);
  for (const link of links) {
    await page.goto(link.href);
    await expect(page.locator('.mevideo-watch-view h1')).toHaveText(link.title);
  }
});

test('invalid video and episode URLs show 404 instead of another video', async ({page}) => {
  for (const path of ['/video/nonexistent', '/video/video-series-01?season=9', '/video/video-series-01?season=1&episode=nonexistent']) {
    await page.goto(path);
    await expect(page.locator('h1')).toContainText('404');
    await expect(page.locator('.mevideo-player')).toHaveCount(0);
  }
});
