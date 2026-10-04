import {test, expect} from '@playwright/test';
if (process.env.PLAYWRIGHT_CHANNEL) test.use({channel: process.env.PLAYWRIGHT_CHANNEL});

test.beforeEach(async ({page}) => {
  await page.route('**/api/v1/auth/me', route => route.fulfill({json: {user: {id: 'video-search-test', username: 'tester'}}}));
  await page.route('**/api/v1/platform/navigation', route => route.fulfill({json: {groups: [], allowedPageCodes: ['video']}}));
});

test('watch later keeps saved videos after reload and removes them', async ({page}) => {
  await page.goto('/video/video-series-01');
  const save = page.locator('.mevideo-watch-view__actions').getByRole('button', {name: 'Смотреть позже', exact: true});
  if (await save.getAttribute('aria-pressed') === 'true') await save.click();
  await save.click();
  await expect(save).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.mcrn-sidebar').getByRole('link', {name: 'Смотреть позже', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Смотреть позже', exact: true})).toBeVisible();
  await page.reload();
  const card = page.locator('.mevideo-media-card').filter({hasText: 'Сериал: пилотный выпуск'});
  await expect(card).toHaveCount(1);
  await card.getByRole('button', {name: 'Действия: Сериал: пилотный выпуск'}).click();
  await page.getByRole('menuitem', {name: 'Убрать из «Смотреть позже»'}).click();
  await expect(card).toHaveCount(0);
  await page.reload();
  await expect(card).toHaveCount(0);
});

test('search suggestions, submit, categories, clear and direct URL', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/video');
  const input = page.getByPlaceholder('Поиск по Mecorion Video');
  await input.focus();
  await expect(page.getByRole('heading', {name: 'Что будем смотреть?'})).toBeVisible();
  await input.fill('тихий город');
  await expect(page.locator('.workspace-search__suggestion')).toHaveCount(1);
  await input.press('ArrowDown');
  await input.press('Enter');
  await expect(page).toHaveURL(/section=search/);
  await expect(page.getByRole('heading', {name: 'Лучший результат'})).toBeVisible();
  await page.getByRole('tab', {name: 'Фильмы', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Ничего не найдено'})).toBeVisible();
  await page.getByRole('button', {name: 'Очистить поиск', exact: true}).last().click();
  await expect(page.getByRole('heading', {name: 'Что будем смотреть?'})).toBeVisible();
  await page.goto('/video?section=search&q=Дорама');
  await expect(page.getByRole('heading', {name: 'Лучший результат'})).toBeVisible();
  await page.reload();
  await expect(input).toHaveValue('Дорама');
  expect(errors).toEqual([]);
});

test('search fits narrow and wide screens', async ({page}) => {
  for (const width of [180, 390, 768, 1440, 2560]) {
    await page.setViewportSize({width, height: 1000});
    for (const url of ['/video?section=search', '/video?section=search&q=Редакция']) {
      await page.goto(url);
      await expect(page.locator('.memusic-search-view')).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      expect(overflow, `overflow at ${width}: ${url}`).toBe(false);
    }
  }
});
