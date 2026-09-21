import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 2,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: {width: 1440, height: 900},
    trace: 'retain-on-failure',
  },
  webServer: {
    command: process.env.MECORION_TEST_DEV
      ? 'npm run dev -- --port 4173 --host 127.0.0.1'
      : 'node .output/server/index.mjs',
    url: 'http://127.0.0.1:4173',
    env: {
      PORT: '4173',
      HOST: '127.0.0.1',
      NUXT_PUBLIC_MECORION_API_URL: 'http://127.0.0.1:4017',
    },
  },
});
