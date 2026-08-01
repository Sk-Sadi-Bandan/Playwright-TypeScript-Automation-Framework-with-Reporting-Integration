import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DARAZ_TEST_CONFIG } from '../../config/test-config';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * TEST SUITE: Daraz - Login
 * ════════════════════════════════════════════════════════════════════════════
 *
 * SIMPLIFIED EXECUTION MODEL:
 * - Step 1: Open the Daraz homepage
 * - Step 2: Log in with phone number and password
 * - Step 3: Verify the login succeeded
 * ════════════════════════════════════════════════════════════════════════════
 */

test.describe('Daraz - Login', () => {
  test('Step 1 to Step 3: Log in with phone number and password', async ({ page }) => {
    const loginPage = new LoginPage(page);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('DARAZ LOGIN FLOW - START');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 1: OPEN THE DARAZ HOMEPAGE
    // ═══════════════════════════════════════════════════════════════════════════
    await test.step('1: Open Daraz homepage', async () => {
      await loginPage.navigateTo();
      console.log(`✓ Homepage loaded: ${DARAZ_TEST_CONFIG.BASE_URL}`);
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2: LOG IN WITH PHONE NUMBER AND PASSWORD
    // ═══════════════════════════════════════════════════════════════════════════
    await test.step('2: Log in with phone number and password', async () => {
      await loginPage.login(DARAZ_TEST_CONFIG.CREDENTIALS.phone, DARAZ_TEST_CONFIG.CREDENTIALS.password);
      console.log('✓ Login submitted');
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 3: VERIFY THE LOGIN SUCCEEDED
    // ═══════════════════════════════════════════════════════════════════════════
    await test.step('3: Verify login succeeded', async () => {
      expect(await loginPage.isLoggedIn()).toBeTruthy();

      const accountLabel = await loginPage.getAccountLabel();
      expect(accountLabel).toBeTruthy();
      console.log(`✓ Logged in successfully: ${accountLabel}`);
    });

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('DARAZ LOGIN FLOW TEST - PASSED');
    console.log('═══════════════════════════════════════════════════════════════\n');
  });
});
