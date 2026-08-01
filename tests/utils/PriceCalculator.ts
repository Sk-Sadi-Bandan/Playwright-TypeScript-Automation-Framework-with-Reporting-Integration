import { PriceCalculations, PriceDataProduct } from './PriceDataStore';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * PRICE CALCULATOR
 * Single Responsibility Principle: All checkout arithmetic lives here, driven
 * entirely by values captured into data/priceData.json (never hardcoded).
 * ════════════════════════════════════════════════════════════════════════════
 */
export function calculatePrices(
  products: PriceDataProduct[],
  actualShippingFee: number
): PriceCalculations {
  for (const product of products) {
    if (
      product.priceWithDiscount == null ||
      product.priceWithoutDiscount == null ||
      product.quantity == null
    ) {
      throw new Error(`Incomplete price data captured for product "${product.id}"`);
    }
  }

  const totalWithoutDiscountPrice = sum(products.map((p) => p.priceWithoutDiscount!));
  const totalWithDiscountPrice = sum(products.map((p) => p.priceWithDiscount!));
  const discount = totalWithoutDiscountPrice - totalWithDiscountPrice;

  const subtotal = sum(products.map((p) => p.priceWithDiscount! * p.quantity!));
  const totalShippingCost = actualShippingFee;
  const totalPrice = subtotal + totalShippingCost;

  return {
    totalWithoutDiscountPrice,
    totalWithDiscountPrice,
    discount,
    subtotal,
    totalShippingCost,
    totalPrice,
  };
}

function sum(values: number[]): number {
  return Math.round(values.reduce((total, value) => total + value, 0) * 100) / 100;
}
