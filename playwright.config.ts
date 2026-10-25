import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  projects: [
    { name:'chromium', use:{browserName:'chromium',launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined}} },
    { name:'iphone-webkit', use:{...devices['iPhone 13'],browserName:'webkit'} },
  ],
  testDir: './tests',
  workers: 1,
  use: {
    headless: true,
    viewport: { width: 425, height: 1000 },
    reducedMotion: 'no-preference',
    screenshot: 'only-on-failure',
  },
});
