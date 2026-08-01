import { Page } from '@playwright/test';
import { DARAZ_TEST_CONFIG } from '../../config/test-config';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * BASE PAGE OBJECT
 * Single Responsibility Principle: Common functionality for all page objects
 * ════════════════════════════════════════════════════════════════════════════
 */
export abstract class BasePage {
  constructor(protected page: Page, protected baseUrl: string = DARAZ_TEST_CONFIG.BASE_URL) {}

  /**
   * Public getter for page
   * Allows child classes and tests to access the page when needed
   */
  public getPage(): Page {
    return this.page;
  }

  /**
   * Navigate to a specific URL path
   * DRY: Centralized navigation logic
   */
  protected async navigateTo(path: string): Promise<void> {
    await this.page.goto(`${this.baseUrl}${path}`);
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Wait for element visibility
   * DRY: Reusable wait logic
   */
  protected async waitForElement(
    locator: ReturnType<Page['locator']> | ReturnType<Page['getByRole']>,
    timeout: number = DARAZ_TEST_CONFIG.TIMEOUTS.element
  ): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  /**
   * Dismiss common Daraz interstitials (cookie/consent banners, "download the
   * app" promos) that can render on top of the page. Each check is best
   * effort and non-fatal: on daraz.com.bd these usually don't appear, so
   * absence is the normal case, not a failure.
   */
  protected async dismissPopupsIfPresent(): Promise<void> {
    const dismissCandidates = [
      this.page.getByRole('button', { name: /accept|allow all|got it/i }),
      this.page.getByRole('link', { name: /continue on web|maybe later|not now/i }),
      this.page.locator('[aria-label="Close" i], .next-dialog-close').first(),
    ];

    for (const candidate of dismissCandidates) {
      const isVisible = await candidate.isVisible({ timeout: DARAZ_TEST_CONFIG.TIMEOUTS.popup }).catch(() => false);
      if (isVisible) {
        await candidate.click({ timeout: DARAZ_TEST_CONFIG.TIMEOUTS.popup }).catch(() => {});
      }
    }
  }
}
