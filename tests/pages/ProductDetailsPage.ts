import { expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { parseAmount } from '../utils/money';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * PRODUCT DETAILS PAGE OBJECT
 * Single Responsibility Principle: Product page interactions only — reading
 * price/name, adjusting quantity, and adding to cart.
 * ════════════════════════════════════════════════════════════════════════════
 */
export class ProductDetailsPage extends BasePage {
  private readonly SELECTORS = {
    title: 'h1.pdp-mod-product-badge-title',
    priceWithDiscount: '.pdp-product-price .pdp-price_type_normal',
    priceWithoutDiscount: '.pdp-product-price .pdp-price_type_deleted',
    quantityIncreaseHandler: '.next-number-picker-handler-up',
    quantityInput: '.next-number-picker input',
    addToCartButton: { role: 'button', name: 'Add to Cart' },
    successDialog: '.next-dialog.cart-dialog',
    closeDialogButton: '.next-dialog-close',
  };

  private getTitle() {
    return this.page.locator(this.SELECTORS.title);
  }

  private getPriceWithDiscountEl() {
    return this.page.locator(this.SELECTORS.priceWithDiscount);
  }

  private getPriceWithoutDiscountEl() {
    return this.page.locator(this.SELECTORS.priceWithoutDiscount);
  }

  private getQuantityIncreaseHandler() {
    return this.page.locator(this.SELECTORS.quantityIncreaseHandler);
  }

  private getQuantityInput() {
    return this.page.locator(this.SELECTORS.quantityInput);
  }

  private getAddToCartButton() {
    return this.page.getByRole('button', { name: this.SELECTORS.addToCartButton.name, exact: true });
  }

  private getSuccessDialog() {
    return this.page.locator(this.SELECTORS.successDialog);
  }

  private getCloseDialogButton() {
    return this.getSuccessDialog().locator(this.SELECTORS.closeDialogButton);
  }

  /**
   * Product title, used to identify this product's row in the cart later.
   */
  async getProductName(): Promise<string> {
    const title = this.getTitle();
    await this.waitForElement(title);
    return (await title.textContent())!.trim();
  }

  /**
   * Current discounted (selling) unit price.
   */
  async getPriceWithDiscount(): Promise<number> {
    const priceEl = this.getPriceWithDiscountEl();
    await this.waitForElement(priceEl);
    return parseAmount((await priceEl.textContent())!);
  }

  /**
   * Original (pre-discount) unit price.
   */
  async getPriceWithoutDiscount(): Promise<number> {
    const priceEl = this.getPriceWithoutDiscountEl();
    await this.waitForElement(priceEl);
    return parseAmount((await priceEl.textContent())!);
  }

  /**
   * Increase the quantity selector by 1 click.
   */
  async increaseQuantityByOne(): Promise<void> {
    const before = await this.getQuantityInput().inputValue();
    await this.getQuantityIncreaseHandler().click();
    await expect(this.getQuantityInput()).not.toHaveValue(before);
  }

  async getQuantity(): Promise<number> {
    return Number(await this.getQuantityInput().inputValue());
  }

  /**
   * Click "Add to Cart" and wait for the success popup to render.
   */
  async addToCart(): Promise<void> {
    await this.getAddToCartButton().click();
    await this.waitForElement(this.getSuccessDialog());
  }

  /**
   * Verify the "Added to cart successfully" popup message appears.
   */
  async verifyAddedToCartPopup(): Promise<void> {
    await expect(this.getSuccessDialog()).toContainText(/added to cart/i);
  }

  /**
   * Close the "Added to cart" success popup.
   */
  async closeAddedToCartPopup(): Promise<void> {
    await this.getCloseDialogButton().click();
    await expect(this.getSuccessDialog()).toBeHidden();
  }
}
