import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { SearchResultsPage } from '../pages/SearchResultsPage';
import { CartPage } from '../pages/CartPage';
import { readTestData, readPriceData, writePriceData } from '../utils/PriceDataStore';
import { calculatePrices } from '../utils/PriceCalculator';
import { DARAZ_TEST_CONFIG } from '../../config/test-config';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * TEST SUITE: Daraz - Checkout (Search -> Cart -> Proceed to Checkout)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * All product/price/discount/shipping data is sourced from the JSON fixtures
 * in /data:
 *  - data/testData.json  — search keywords, shipping cost, platform fee
 *  - data/priceData.json — prices captured live from the site + calculations,
 *                           written by this test and read back for assertions
 *
 * The cart is cleared as a precondition so every run starts from a known,
 * empty state (Daraz persists cart contents and checkbox selection across
 * sessions, so a dirty cart would otherwise skew every total below).
 *
 * The test clicks "Proceed to Checkout" only once every cart-page assertion
 * has passed, then validates the checkout page's Order Summary panel (Items
 * Total / Delivery Fee / Platform Fee / Total Amount) and stops there —
 * "Proceed to Pay" is never clicked, so no real payment is made.
 * ════════════════════════════════════════════════════════════════════════════
 */

test.describe('Daraz - Checkout', () => {
  test('Search two products, validate cart pricing, and proceed to checkout', async ({ page }) => {
    const testData = readTestData();
    const priceData = readPriceData();

    const loginPage = new LoginPage(page);
    const homePage = new HomePage(page);
    const cartPage = new CartPage(page);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('DARAZ CHECKOUT FLOW - START');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 1: LOGIN
    // ═══════════════════════════════════════════════════════════════════════
    await test.step('1: Log in', async () => {
      await loginPage.navigateTo();
      await loginPage.login(DARAZ_TEST_CONFIG.CREDENTIALS.phone, DARAZ_TEST_CONFIG.CREDENTIALS.password);
      expect(await loginPage.isLoggedIn()).toBeTruthy();
      console.log('✓ Logged in successfully');
    });

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 2: PRECONDITION — CLEAR CART
    // ═══════════════════════════════════════════════════════════════════════
    await test.step('2: Clear the cart', async () => {
      await cartPage.clearCart();
      expect(await cartPage.getItemCount()).toBe(0);
      console.log('✓ Cart is empty');
    });

    // ═══════════════════════════════════════════════════════════════════════
    // STEPS 3-4: SEARCH & ADD TO CART FOR EACH PRODUCT
    // ═══════════════════════════════════════════════════════════════════════
    for (const [index, testProduct] of testData.products.entries()) {
      const priceDataProduct = priceData.products.find((p) => p.id === testProduct.id);
      if (!priceDataProduct) {
        throw new Error(`No priceData.json entry found for product id "${testProduct.id}"`);
      }

      await test.step(`${index + 3}: Search "${testProduct.searchKeyword}", open first result, add to cart`, async () => {
        await homePage.searchProduct(testProduct.searchKeyword);

        const searchResultsPage = new SearchResultsPage(page);
        const productPage = await searchResultsPage.openFirstProduct();

        priceDataProduct.name = await productPage.getProductName();
        priceDataProduct.priceWithDiscount = await productPage.getPriceWithDiscount();
        priceDataProduct.priceWithoutDiscount = await productPage.getPriceWithoutDiscount();

        await productPage.increaseQuantityByOne();
        await productPage.addToCart();
        await productPage.verifyAddedToCartPopup();
        await productPage.closeAddedToCartPopup();

        console.log(
          `✓ Added "${priceDataProduct.name}" to cart (৳${priceDataProduct.priceWithDiscount} / ৳${priceDataProduct.priceWithoutDiscount})`
        );
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 5: CART VALIDATION
    // ═══════════════════════════════════════════════════════════════════════
    await test.step('5: Validate cart contents, decrease quantity, select products', async () => {
      await cartPage.navigateTo();

      // The cart started empty, so it must now contain exactly these 2 items.
      expect(await cartPage.getItemCount()).toBe(testData.products.length);

      for (const priceDataProduct of priceData.products) {
        const name = priceDataProduct.name!;
        expect(await cartPage.isProductPresent(name)).toBeTruthy();

        priceDataProduct.quantity = await cartPage.decreaseQuantityIfNeeded(name);
        await cartPage.selectProduct(name);

        console.log(`✓ Verified "${name}" in cart, quantity: ${priceDataProduct.quantity}`);
      }
    });

    // ═══════════════════════════════════════════════════════════════════════
    // STEPS 6-8: PRICE/DISCOUNT, SUBTOTAL/SHIPPING, TOTAL — discount and
    // subtotal are computed from data/priceData.json and cross-checked
    // against the live cart. Shipping is not predictable from static config
    // (Daraz combines/discounts it per seller and promotion), so the live
    // cart's Shipping Fee is read as ground truth; only subtotal + shipping
    // == total is verified for internal consistency.
    // ═══════════════════════════════════════════════════════════════════════
    await test.step('6-8: Calculate discount, subtotal, shipping and total from JSON data', async () => {
      const liveShippingFee = await cartPage.getShippingFee();
      priceData.calculations = calculatePrices(priceData.products, liveShippingFee);
      writePriceData(priceData);

      const { calculations } = priceData;
      console.log(
        `✓ Without discount: ৳${calculations.totalWithoutDiscountPrice}, With discount: ৳${calculations.totalWithDiscountPrice}, Discount: ৳${calculations.discount}`
      );
      console.log(
        `✓ Subtotal: ৳${calculations.subtotal}, Shipping: ৳${calculations.totalShippingCost}, Total: ৳${calculations.totalPrice}`
      );

      expect(await cartPage.getSubtotal()).toBe(calculations.subtotal);
      expect(await cartPage.getTotal()).toBe(calculations.totalPrice);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 9: PROCEED TO CHECKOUT (only reached if every prior expect() passed)
    // ═══════════════════════════════════════════════════════════════════════
    let checkoutPage!: Awaited<ReturnType<typeof cartPage.proceedToCheckout>>;
    await test.step('9: Proceed to checkout', async () => {
      checkoutPage = await cartPage.proceedToCheckout();
      console.log('✓ Proceeded to checkout');
    });

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 10: CHECKOUT PAGE — ORDER SUMMARY VALIDATION (right side panel)
    // Items Total mirrors the cart Subtotal already verified in step 6-8;
    // Delivery Fee mirrors the cart Shipping Fee; Platform Fee is a fixed
    // fee sourced from data/testData.json. Total Amount must equal their sum.
    // ═══════════════════════════════════════════════════════════════════════
    await test.step('10: Validate the checkout page Order Summary', async () => {
      const { calculations } = priceData;
      const expectedTotalAmount =
        calculations.subtotal! + calculations.totalShippingCost! + testData.platformFee;

      expect(await checkoutPage.getItemsTotal()).toBe(calculations.subtotal);
      expect(await checkoutPage.getDeliveryFee()).toBe(calculations.totalShippingCost);
      expect(await checkoutPage.getPlatformFee()).toBe(testData.platformFee);
      expect(await checkoutPage.getTotalAmount()).toBe(expectedTotalAmount);

      console.log(
        `✓ Items Total: ৳${calculations.subtotal}, Delivery Fee: ৳${calculations.totalShippingCost}, ` +
          `Platform Fee: ৳${testData.platformFee}, Total Amount: ৳${expectedTotalAmount}`
      );

      await page.waitForTimeout(2000);
    });

    // Stop here by design: the account already has a saved delivery address,
    // so no further step is in scope, and "Proceed to Pay" is never clicked —
    // no real payment is made.
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('DARAZ CHECKOUT FLOW TEST - PASSED');
    console.log('═══════════════════════════════════════════════════════════════\n');
  });
});
