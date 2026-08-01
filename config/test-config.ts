/**
 * ════════════════════════════════════════════════════════════════════════════
 * DARAZ AUTOMATION - TEST CONFIGURATION
 * Single Responsibility Principle: Centralized Daraz configuration management
 * DRY: All configuration constants defined in one place
 * ════════════════════════════════════════════════════════════════════════════
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var ${name}. Copy .env.example to .env and set it.`);
  }
  return value;
}

export const DARAZ_TEST_CONFIG = {
  BASE_URL: process.env.DARAZ_BASE_URL || 'https://www.daraz.com.bd',

  CREDENTIALS: {
    phone: requireEnv('DARAZ_PHONE'),
    password: requireEnv('DARAZ_PASSWORD'),
  },

  TIMEOUTS: {
    navigation: 15000,
    element: 10000,
    loginOutcome: 20000,
    popup: 3000,
  },

  // Routes for different sections of the application
  // DRY: All routes centralized for easy maintenance
  ROUTES: {
    home: '/',
  },

  // Cart/Checkout live on their own subdomains, so these are full URLs
  // rather than paths appended to BASE_URL.
  CART_URL: 'https://cart.daraz.com.bd/cart',
  CHECKOUT_URL: 'https://checkout.daraz.com.bd/shipping',
};
