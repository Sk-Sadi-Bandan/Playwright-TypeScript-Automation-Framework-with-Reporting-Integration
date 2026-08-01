import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { CheckoutPage } from './CheckoutPage';
import { parseAmount } from '../utils/money';
import { DARAZ_TEST_CONFIG } from '../../config/test-config';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * CART PAGE OBJECT
 * Single Responsibility Principle: Cart page interactions only — verifying
 * line items, adjusting quantity, selecting items, and reading the order
 * summary (Subtotal/Shipping/Total), which reflects only the checked items.
 * ════════════════════════════════════════════════════════════════════════════
 */
export class CartPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private readonly SELECTORS = {
    itemRow: '.cart-item',
    itemCheckbox: '.cart-item-checkbox',
    quantityInput: '.cart-item-number-picker input',
    quantityDecreaseHandler: '.next-number-picker-handler-down',
    deleteButton: '.automation-btn-delete',
    confirmRemoveButton: { role: 'button', name: 'REMOVE' },
    summaryRow: '.checkout-summary-row',
    totalValue: '.checkout-order-total-fee',
    proceedToCheckoutButton: '.automation-checkout-order-total-button-button',
  };

  /**
   * Navigate directly to the cart (lives on its own subdomain).
   */
  async navigateTo(): Promise<void> {
    await this.page.goto(DARAZ_TEST_CONFIG.CART_URL);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getItemCount(): Promise<number> {
    return await this.page.locator(this.SELECTORS.itemRow).count();
  }

  /**
   * Remove every item from the cart, one by one, confirming the "Remove
   * from cart" dialog each time. Used as a precondition so every test run
   * starts from a known-empty cart instead of accumulating items/quantity
   * across runs.
   */
  async clearCart(): Promise<void> {
    await this.navigateTo();

    let itemCount = await this.getItemCount();
    while (itemCount > 0) {
      await this.removeFirstItem();
      itemCount--;
    }
  }

  /**
   * Delete the first row in the cart and confirm the "REMOVE" dialog,
   * waiting for the row count to actually drop before moving on.
   */
  private async removeFirstItem(): Promise<void> {
    const rows = this.page.locator(this.SELECTORS.itemRow);
    const countBeforeDelete = await rows.count();

    await rows.first().locator(this.SELECTORS.deleteButton).click();
    await this.page
      .getByRole('button', { name: this.SELECTORS.confirmRemoveButton.name, exact: true })
      .click();

    await expect(rows).toHaveCount(countBeforeDelete - 1);
  }

  /**
   * Locate a product's row by (substring match of) its full product name.
   */
  private getItemRow(productName: string) {
    return this.page.locator(this.SELECTORS.itemRow).filter({ hasText: productName }).first();
  }

  async isProductPresent(productName: string): Promise<boolean> {
    return await this.getItemRow(productName).isVisible().catch(() => false);
  }

  /**
   * Select a product's checkbox in the cart. Waits for the checkbox to
   * actually register as checked (each selection triggers an async summary
   * recalculation) before returning, so a fast second selection can't race
   * ahead of the first one's server round-trip.
   */
  async selectProduct(productName: string): Promise<void> {
    const checkbox = this.getItemRow(productName).locator(this.SELECTORS.itemCheckbox);
    const input = checkbox.locator('input');
    await this.waitForElement(checkbox);
    await checkbox.click();
    await expect(input).toBeChecked();
  }

  async getQuantity(productName: string): Promise<number> {
    const input = this.getItemRow(productName).locator(this.SELECTORS.quantityInput);
    return Number(await input.inputValue());
  }

  /**
   * Decrease a product's quantity by 1, only if it is currently above the
   * minimum of 1.
   */
  async decreaseQuantityIfNeeded(productName: string): Promise<number> {
    const currentQuantity = await this.getQuantity(productName);
    if (currentQuantity > 1) {
      const row = this.getItemRow(productName);
      const decreaseHandler = row.locator(this.SELECTORS.quantityDecreaseHandler);
      const input = row.locator(this.SELECTORS.quantityInput);
      await decreaseHandler.click();
      await expect(input).not.toHaveValue(String(currentQuantity));
    }
    return await this.getQuantity(productName);
  }

  /**
   * Read a "Label ৳ Amount" row from the order summary panel (scoped to
   * whichever items are currently checked).
   */
  private getSummaryRow(labelPattern: RegExp) {
    return this.page.locator(this.SELECTORS.summaryRow).filter({ hasText: labelPattern });
  }

  private async getSummaryAmount(labelPattern: RegExp): Promise<number> {
    const row = this.getSummaryRow(labelPattern);
    await this.waitForElement(row);
    return parseAmount((await row.textContent())!);
  }

  /**
   * Checking an item's checkbox triggers an async recalculation of the
   * order summary — wait for the "Subtotal (0 items)" placeholder to clear
   * before reading any amount, otherwise a stale/in-flight value is read.
   */
  private async waitForSelectionToSettle(): Promise<void> {
    await expect(this.getSummaryRow(/Subtotal/i)).not.toContainText('(0 items)');
  }

  async getSubtotal(): Promise<number> {
    await this.waitForSelectionToSettle();
    return this.getSummaryAmount(/Subtotal/i);
  }

  async getShippingFee(): Promise<number> {
    await this.waitForSelectionToSettle();
    return this.getSummaryAmount(/Shipping Fee/i);
  }

  async getTotal(): Promise<number> {
    await this.waitForSelectionToSettle();
    const totalEl = this.page.locator(this.SELECTORS.totalValue);
    await this.waitForElement(totalEl);
    return parseAmount((await totalEl.textContent())!);
  }

  /**
   * Click "Proceed to Checkout" for the currently checked items and land on
   * the checkout (shipping) page.
   */
  async proceedToCheckout(): Promise<CheckoutPage> {
    const button = this.page.locator(this.SELECTORS.proceedToCheckoutButton);
    await this.waitForElement(button);
    await button.click();
    await this.page.waitForLoadState('domcontentloaded');
    return new CheckoutPage(this.page);
  }
}
