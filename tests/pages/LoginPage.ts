import { BasePage } from './BasePage';
import { DARAZ_TEST_CONFIG } from '../../config/test-config';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * LOGIN PAGE OBJECT
 * Single Responsibility Principle: Login-specific functionality only
 *
 * Daraz opens the sign-in form as an in-page overlay from the header "Login"
 * link rather than navigating to a dedicated URL, so this page object drives
 * that overlay directly instead of relying on a URL change.
 * ════════════════════════════════════════════════════════════════════════════
 */
export class LoginPage extends BasePage {
  // ═══════════════════════════════════════════════════════════════════════════
  // SELECTORS - Maintained in Page Object Model (not in config)
  // Single Responsibility: All login page selectors defined here
  // ═══════════════════════════════════════════════════════════════════════════

  private readonly SELECTORS = {
    headerLoginLink: { role: 'link', name: 'Login', exact: true },
    phoneOrEmailInput: 'Please enter your Phone or Email',
    passwordInput: 'Please enter your password',
    loginButton: { role: 'button', name: 'LOGIN', exact: true },
    // Daraz shows failures as an inline/toast message rather than a form validation error
    errorMessage: /incorrect|invalid|wrong|doesn.?t match|failed|too many attempts|not found/i,
    // Bot/abuse checks (captcha, slider, SMS OTP challenge) cannot be solved by automation
    verificationChallenge: /captcha|verify you|verification code|unusual traffic|slide to verify|security check/i,
    // Header swaps "Login"/"Sign Up" for "<Name>'s account" once authenticated
    accountMenu: /'s account$/i,
  };

  /**
   * Get header "Login" link that opens the sign-in overlay
   */
  private getHeaderLoginLink() {
    return this.page.getByRole(this.SELECTORS.headerLoginLink.role as any, {
      name: this.SELECTORS.headerLoginLink.name,
      exact: this.SELECTORS.headerLoginLink.exact,
    });
  }

  /**
   * Get phone/email input field
   */
  private getPhoneOrEmailField() {
    return this.page.getByPlaceholder(this.SELECTORS.phoneOrEmailInput);
  }

  /**
   * Get password input field
   */
  private getPasswordField() {
    return this.page.getByPlaceholder(this.SELECTORS.passwordInput);
  }

  /**
   * Get login submit button
   */
  private getLoginButton() {
    return this.page.getByRole(this.SELECTORS.loginButton.role as any, {
      name: this.SELECTORS.loginButton.name,
      exact: this.SELECTORS.loginButton.exact,
    });
  }

  /**
   * Get error/toast message element
   */
  private getErrorMessage() {
    return this.page.getByText(this.SELECTORS.errorMessage);
  }

  /**
   * Get captcha/OTP verification challenge element
   */
  private getVerificationChallenge() {
    return this.page.getByText(this.SELECTORS.verificationChallenge);
  }

  /**
   * Get the logged-in account menu (header text ending in "'s account")
   */
  private getAccountMenu() {
    return this.page.getByText(this.SELECTORS.accountMenu);
  }

  /**
   * Navigate to the Daraz homepage
   */
  async navigateTo(): Promise<void> {
    await super.navigateTo(DARAZ_TEST_CONFIG.ROUTES.home);
  }

  /**
   * Open the sign-in overlay from the header
   * DRY: Reusable method with base class logic
   */
  private async openLoginForm(): Promise<void> {
    const loginLink = this.getHeaderLoginLink();
    await this.waitForElement(loginLink);
    await loginLink.click();

    const phoneOrEmailField = this.getPhoneOrEmailField();
    await this.waitForElement(phoneOrEmailField);
  }

  /**
   * Fill phone/email field
   * DRY: Reusable method with base class logic
   */
  private async fillPhoneOrEmail(phoneOrEmail: string): Promise<void> {
    const field = this.getPhoneOrEmailField();
    await this.waitForElement(field);
    await field.fill(phoneOrEmail);
  }

  /**
   * Fill password field
   * DRY: Reusable method with base class logic
   */
  private async fillPassword(password: string): Promise<void> {
    const field = this.getPasswordField();
    await this.waitForElement(field);
    await field.fill(password);
  }

  /**
   * Click login button
   * DRY: Reusable method with base class logic
   */
  private async clickLoginButton(): Promise<void> {
    const loginButton = this.getLoginButton();
    await this.waitForElement(loginButton);
    await loginButton.click();
  }

  /**
   * Wait for login outcome
   * DRY: Races success (header account menu appears), a visible error
   * message, and a verification challenge, so the test fails fast with a
   * clear reason instead of timing out blindly.
   */
  private async waitForLoginOutcome(): Promise<void> {
    try {
      await Promise.race([
        this.getAccountMenu().waitFor({ state: 'visible', timeout: DARAZ_TEST_CONFIG.TIMEOUTS.loginOutcome }),
        this.getErrorMessage().waitFor({ state: 'visible', timeout: DARAZ_TEST_CONFIG.TIMEOUTS.loginOutcome }),
        this.getVerificationChallenge().waitFor({ state: 'visible', timeout: DARAZ_TEST_CONFIG.TIMEOUTS.loginOutcome }),
      ]);
    } catch (error) {
      throw new Error('Login: no success, error, or verification challenge appeared within the timeout');
    }
  }

  /**
   * Check if a verification challenge (captcha/OTP) is blocking login
   * DRY: Reusable challenge check
   */
  private async isVerificationChallengeDisplayed(): Promise<boolean> {
    return await this.getVerificationChallenge().isVisible({ timeout: 500 }).catch(() => false);
  }

  /**
   * Check if error is displayed
   * DRY: Reusable error check
   */
  private async isErrorDisplayed(): Promise<boolean> {
    return await this.getErrorMessage().isVisible({ timeout: 500 }).catch(() => false);
  }

  /**
   * Get error message text
   * DRY: Reusable error text extraction
   */
  private async getErrorText(): Promise<string | null> {
    if (await this.isErrorDisplayed()) {
      return await this.getErrorMessage().first().textContent();
    }
    return null;
  }

  /**
   * Perform login with phone/email + password
   * Open/Closed Principle: Can be extended for OTP or social login later
   */
  async login(phoneOrEmail: string, password: string): Promise<void> {
    await this.openLoginForm();
    await this.dismissPopupsIfPresent();

    await this.fillPhoneOrEmail(phoneOrEmail);
    await this.fillPassword(password);
    await this.clickLoginButton();
    await this.waitForLoginOutcome();

    if (await this.isVerificationChallengeDisplayed()) {
      throw new Error(
        'Login blocked by a captcha/OTP verification challenge that cannot be solved by automation. ' +
          'Complete it once interactively, or retry later if it was triggered by repeated automated runs.'
      );
    }

    if (await this.isErrorDisplayed()) {
      const errorText = await this.getErrorText();
      throw new Error(`Login failed: ${errorText}`);
    }
  }

  /**
   * Check if logged in successfully
   * DRY: Confirms both that the anonymous "Login" link is gone and the
   * authenticated account menu is present, to avoid false positives from a
   * still-loading header.
   */
  async isLoggedIn(): Promise<boolean> {
    const loginLinkHidden = await this.getHeaderLoginLink().isHidden().catch(() => true);
    const accountMenuVisible = await this.getAccountMenu().isVisible({ timeout: 3000 }).catch(() => false);
    return loginLinkHidden && accountMenuVisible;
  }

  /**
   * Read the logged-in account label (e.g. "Jane Doe's account") for logging/assertions
   */
  async getAccountLabel(): Promise<string | null> {
    return await this.getAccountMenu().first().textContent();
  }
}
