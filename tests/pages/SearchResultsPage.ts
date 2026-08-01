import { BasePage } from './BasePage';
import { ProductDetailsPage } from './ProductDetailsPage';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * SEARCH RESULTS PAGE OBJECT
 * Single Responsibility Principle: Locating and opening products from a
 * keyword search results grid only.
 * ════════════════════════════════════════════════════════════════════════════
 */
export class SearchResultsPage extends BasePage {
  private readonly SELECTORS = {
    // Every product card links to /products/... — the first match in the
    // results grid is the first product card, regardless of Daraz's
    // frequently-changing hashed CSS class names.
    productLink: 'a[href*="/products/"]',
  };

  private getFirstProductLink() {
    return this.page.locator(this.SELECTORS.productLink).first();
  }

  /**
   * Open the first product's details page from the current search results.
   */
  async openFirstProduct(): Promise<ProductDetailsPage> {
    const firstProduct = this.getFirstProductLink();
    await this.waitForElement(firstProduct);
    await firstProduct.click();
    await this.page.waitForLoadState('domcontentloaded');
    return new ProductDetailsPage(this.page);
  }
}
