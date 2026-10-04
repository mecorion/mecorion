import {test, expect} from '@playwright/test';
if (process.env.PLAYWRIGHT_CHANNEL) test.use({channel: process.env.PLAYWRIGHT_CHANNEL});
test.use({viewport: {width: 320, height: 800}});
test('Video pages fit small screens', async ({page}, testInfo) => {
  test.setTimeout(120000);
  await page.route('**/api/v1/auth/me', route => route.fulfill({json: {user: {id: 'responsive-test'}}}));
  await page.route('**/api/v1/platform/navigation', route => route.fulfill({json: {groups: [], allowedPageCodes: ['video']}}));
  const urls = ['/video', '/video/library', '/video?section=watchLater', '/video?section=search', '/video?section=search&q=Редакция', '/video/video-series-01', '/video/director-a-scenes'];
  for (const width of [180, 320, 390, 768, 1440, 2560]) {
    await page.setViewportSize({width, height: 800});
    for (const [index, url] of urls.entries()) {
      await page.goto(url);
      await expect(page.locator('.mevideo-content')).toBeVisible();
      await expect(page.locator('h1').first()).toBeVisible();
      await page.screenshot({path: testInfo.outputPath(`video-${width}-${index}.png`), fullPage: true});
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      expect.soft(overflow, `${width}: ${url}`).toBe(false);
    }
  }
});

test('player controls remain usable at 320px', async ({page}, testInfo) => {
  await page.route('**/api/v1/auth/me', route => route.fulfill({json: {user: {id: 'responsive-test'}}}));
  await page.route('**/api/v1/platform/navigation', route => route.fulfill({json: {groups: [], allowedPageCodes: ['video']}}));
  await page.goto('/video/video-series-01');
  await page.getByRole('combobox', {name: 'Сезон', exact: true}).click();
  await page.getByRole('option', {name: 'Сезон 2', exact: true}).click();
  await expect(page).toHaveURL(/season=2/);
  await page.getByRole('combobox', {name: 'Серия', exact: true}).click();
  await page.getByRole('option', {name: 'Эпизод 2 · 47 мин', exact: true}).click();
  await expect(page).toHaveURL(/episode=video-series-01-s2-e2/);
  const settings = page.getByRole('button', {name: 'Настройки просмотра', exact: true});
  await settings.scrollIntoViewIfNeeded();
  const position = await page.evaluate(() => scrollY);
  await settings.click();
  await expect(page.getByRole('dialog', {name: 'Настройки просмотра'})).toBeVisible();
  expect(await page.evaluate(() => scrollY)).toBe(position);
  await page.screenshot({path: testInfo.outputPath('settings-320.png'), fullPage: true});
  await page.keyboard.press('Escape');
  await page.getByRole('button', {name: 'Переключить тему'}).click();
  await page.screenshot({path: testInfo.outputPath('player-dark-320.png'), fullPage: true});
});
