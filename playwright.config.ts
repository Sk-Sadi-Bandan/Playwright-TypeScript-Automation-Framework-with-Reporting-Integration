import { defineConfig, devices } from '@playwright/test';
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, ".env"), override: true });

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { open: "never", outputFolder: 'reports/playwright/latest' }],
    ['blob', {
      outputDir: 'reports/playwright/flow-wise/blob',
      fileName: `${process.env.TEST_FLOW_NAME || 'report'}.zip`,
    }],
  ],
  /* Global test timeout - 10 minutes for long-running end-to-end flows */
  timeout: 600000,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    // baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    navigationTimeout: 60000,
  },

  /* Configure projects for major browsers */
  projects: [
  {
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      deviceScaleFactor: undefined,
      viewport: null,
      launchOptions: {
        ignoreDefaultArgs: ['--disable-component-extensions-with-background-pages'],
        args: [
          '--start-maximized',
          '--no-first-run',
          '--disable-blink-features=AutomationControlled',
          '--disable-infobars',
          '--ignore-certificate-errors',
          '--no-default-browser-check',
          '--disable-popup-blocking',
          '--disable-notifications'
        ]
      }
    }
  },

    // -------------------------------------------------------------
    // 🦊 FIREFOX (Desktop)
    // // -------------------------------------------------------------
    // {
    //   name: "firefox",
    //   use: {
    //     ...devices["Desktop Firefox"],
    //     viewport: { width: 1920, height: 1080 },
    //     launchOptions: {
    //       headless: false,
    //       firefoxUserPrefs: {
    //         "security.enterprise_roots.enabled": true,
    //         "security.cert_pinning.enforcement_level": 0,
    //         "security.mixed_content.block_active_content": false,
    //         "security.mixed_content.block_display_content": false,
    //         "dom.webdriver.enabled": false,           // hide automation flag
    //         "use_automation_extension": false
    //       }
    //     }
    //   }
    // },

    // -------------------------------------------------------------
    // 📱 PIXEL 7 MOBILE (Chrome Android)
    // -------------------------------------------------------------
    // {
    //   name: "Google Pixel",
    //   use: {
    //     ...devices["Pixel 7"],
    //     launchOptions: {
    //       args: [
    //         "--disable-blink-features=AutomationControlled",
    //         "--disable-infobars",
    //         "--ignore-certificate-errors"
    //       ]
    //     }
    //   }
    // }

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {  
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Global setup to run before all tests */
  globalSetup: require.resolve('./tests/helpers/setup-env.ts'),
  globalTeardown: require.resolve('./tests/helpers/teardown-setup.ts'),

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});

export const baseConfig = defineConfig({});
