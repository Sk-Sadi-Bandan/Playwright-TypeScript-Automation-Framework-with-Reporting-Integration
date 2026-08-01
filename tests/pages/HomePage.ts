import { BasePage } from './BasePage';
import { DARAZ_TEST_CONFIG } from '../../config/test-config';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * HOME PAGE OBJECT
 * Single Responsibility Principle: Homepage/header search only.
 * The "Search in Daraz" box lives in the header and is present on every page,
 * but this object models it from its natural entry point (the homepage).
 * ════════════════════════════════════════════════════════════════════════════
 */
export class HomePage extends BasePage {
  private readonly SELECTORS = {
    searchBox: { role: 'searchbox', name: 'Search in Daraz' },
  };

  private getSearchBox() {
    return this.page.getByRole('searchbox', { name: this.SELECTORS.searchBox.name });
  }

  async navigateTo(): Promise<void> {
    await super.navigateTo(DARAZ_TEST_CONFIG.ROUTES.home);
    await this.dismissPopupsIfPresent();
  }

  /**
   * Search for a product by keyword and wait for the results grid to load.
   */
  async searchProduct(keyword: string): Promise<void> {
    const searchBox = this.getSearchBox();
    await this.waitForElement(searchBox);
    await searchBox.fill(keyword);
    await searchBox.press('Enter');
    await this.page.waitForLoadState('domcontentloaded');
  }
}
