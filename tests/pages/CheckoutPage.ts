import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { parseAmount } from '../utils/money';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * CHECKOUT PAGE OBJECT
 * Single Responsibility Principle: Checkout (shipping) page interactions only —
 * reading the Order Summary panel (Items Total / Delivery Fee / Platform Fee /
 * Total). This object intentionally has no method that submits payment: the
 * flow stops at this page, so "Proceed to Pay" is never modeled/clicked here.
 * ════════════════════════════════════════════════════════════════════════════
 */
export class CheckoutPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private readonly SELECTORS = {
    summaryRow: '.checkout-summary-row',
    totalValue: '.checkout-order-total-fee',
  };

  /**
   * Locate a "Label ৳ Amount" row from the Order Summary panel.
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
   * "Items Total (N Items)" — the checked cart items' total, i.e. the sum of
   * each item's discounted price × quantity (same figure as the cart's
   * Subtotal).
   */
  async getItemsTotal(): Promise<number> {
    return this.getSummaryAmount(/Items\s*Total/i);
  }

  async getDeliveryFee(): Promise<number> {
    return this.getSummaryAmount(/Delivery Fee/i);
  }

  async getPlatformFee(): Promise<number> {
    return this.getSummaryAmount(/Platform Fee/i);
  }

  /**
   * "Total" — Items Total + Delivery Fee + Platform Fee.
   */
  async getTotalAmount(): Promise<number> {
    const totalEl = this.page.locator(this.SELECTORS.totalValue);
    await this.waitForElement(totalEl);
    return parseAmount((await totalEl.textContent())!);
  }
}
