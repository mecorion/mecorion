import {test, expect} from '@playwright/test';
if (process.env.PLAYWRIGHT_CHANNEL) test.use({channel: process.env.PLAYWRIGHT_CHANNEL});

test('Books UI Kit screens and filters fit all widths', async ({page}, testInfo) => {
  test.setTimeout(120000);
  await page.route('**/api/v1/auth/me', route => route.fulfill({json: {user: {id: 'books-ui-test'}}}));
  await page.route('**/api/v1/platform/navigation', route => route.fulfill({json: {groups: [], allowedPageCodes: ['books']}}));
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [180, 320, 390, 768, 1440, 2560]) {
    await page.setViewportSize({width, height: 900});
    await page.goto('/books');
    await expect(page.locator('.books-home')).toBeVisible();
    for (const section of ['home', 'search', 'library', 'bookmarks', 'reader']) {
      if (section === 'search') await page.getByRole('button', {name: 'Найти книгу', exact: true}).click();
      if (section === 'library') await page.getByRole('combobox', {name: 'Раздел', exact: true}).click();
      if (section === 'library') await page.getByRole('option', {name: 'Все', exact: true}).click();
      if (section === 'bookmarks') { await page.getByRole('combobox', {name: 'Раздел', exact: true}).click(); await page.getByRole('option', {name: 'Закладки', exact: true}).click(); }
      if (section === 'reader') await page.locator('.mebook-card').first().getByRole('button', {name: 'Читать', exact: true}).click();
      await expect(page.locator('.mebook-content h1')).toBeVisible();
      expect.soft(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `${width}: ${section}`).toBe(false);
      await page.screenshot({path: testInfo.outputPath(`books-${width}-${section}.png`), fullPage: true});
    }
  }
  expect(errors).toEqual([]);
});
