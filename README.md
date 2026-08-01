# Playwright TypeScript Automation Framework with Reporting Integration

End-to-end automation testing framework for the [Daraz](https://www.daraz.com.bd/) e-commerce website, built with **Playwright** and **TypeScript**, and integrated with HTML/Allure-style reporting.

---

## 1. Project Description

- End-to-end (E2E) UI automation project — it simulates real user actions in a browser, from login to checkout.
- Built with **Playwright** + **TypeScript** using the **Page Object Model (POM)** design pattern.
- Automates a full shopping journey on Daraz:
  - Login
  - Product search
  - Add to cart
  - Cart validation (items, quantity, pricing)
  - Price, discount, subtotal & shipping calculation
  - Checkout flow (stops before payment — no real order is placed)
- Test data (prices, discounts, product info) is kept in JSON files, not hardcoded in the test code.
- Generates HTML reports after every run for easy result review.

---

## 2. Features

- 🔐 **Login automation** — logs in with phone number and password.
- 🧹 **Cart cleanup before execution** — clears the cart first so every run starts from a clean, predictable state.
- 🔍 **Product search & add to cart** — searches by keyword, opens the first result, updates quantity, adds to cart.
- 🛒 **Cart validation** — verifies each product is present in the cart with the correct quantity.
- 💰 **Price, discount, subtotal & shipping calculation** — computed from JSON data and cross-checked against the live cart totals.
- ✅ **Checkout process automation (without payment)** — proceeds to checkout and validates the Order Summary (Items Total, Delivery Fee, Platform Fee, Total Amount). The final "Proceed to Pay" step is intentionally **never** clicked.

---

## 3. Tech Stack

| Category            | Technology                              |
|---------------------|------------------------------------------|
| Test Framework      | [Playwright Test](https://playwright.dev/) |
| Language            | TypeScript                              |
| Test Data           | JSON                                    |
| Reporting           | Playwright HTML Reporter, Blob reports (mergeable), Allure |
| Environment Config  | dotenv (`.env` files)                   |
| CI/CD               | Jenkins (`Jenkinsfile` included)        |

---

## 4. Project Structure

```
Daraz_Playwright/
├── config/
│   └── test-config.ts        # Central config: base URL, credentials, timeouts, routes
├── data/
│   ├── testData.json         # Search keywords, platform fee (static input data)
│   └── priceData.json        # Prices captured live + calculated totals (updated by tests)
├── tests/
│   ├── pages/                 # Page Object Model — one class per page
│   │   ├── BasePage.ts
│   │   ├── LoginPage.ts
│   │   ├── HomePage.ts
│   │   ├── SearchResultsPage.ts
│   │   ├── ProductDetailsPage.ts
│   │   ├── CartPage.ts
│   │   └── CheckoutPage.ts
│   ├── tests/                 # Test specs (the actual test scenarios)
│   │   ├── login.spec.ts
│   │   └── fullFlow.spec.ts
│   ├── utils/                  # Helper/utility logic
│   │   ├── PriceCalculator.ts    # Discount, subtotal, shipping & total math
│   │   ├── PriceDataStore.ts     # Reads/writes data/priceData.json & testData.json
│   │   └── money.ts               # Currency/number parsing helpers
│   └── helpers/                # Playwright global setup/teardown hooks
├── reports/                    # Generated HTML test reports (after a run)
├── playwright.config.ts        # Playwright configuration (browsers, reporters, timeouts)
├── package.json                 # npm scripts and dependencies
├── .env.example                  # Template for required environment variables
└── Jenkinsfile                    # CI pipeline definition
```

**Folder purpose, in short:**
- `config/` → project-wide settings (URLs, credentials, timeouts).
- `data/` → test data in JSON — what to search for and what prices/discounts to expect.
- `tests/pages/` → one file per web page, containing only the actions available on that page (Page Object Model).
- `tests/tests/` → the actual test scenarios that use the page objects.
- `tests/utils/` → reusable helper functions (price math, JSON read/write).
- `reports/` → where test result reports are saved after running.

---

## 5. Prerequisites

Before running this project, make sure you have the following installed:

- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes bundled with Node.js)
- Git (to clone the repository)

You do **not** need to install Playwright or browsers manually — that's covered in the installation steps below.

---

## 6. Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   ```

2. **Navigate to the project folder**
   ```bash
   cd Daraz_Playwright
   ```

3. **Install dependencies**
   ```bash
   npm ci
   ```
   (Use `npm ci` instead of `npm install` — it installs the exact versions locked in `package-lock.json`.)

4. **Install Playwright browsers**
   ```bash
   npx playwright install
   ```

5. **Set up your environment variables**
   - Copy `.env.example` to `.env`
   - Fill in your Daraz login credentials:
     ```
     DARAZ_BASE_URL=https://www.daraz.com.bd
     DARAZ_PHONE=<your-phone-number>
     DARAZ_PASSWORD=<your-password>
     ```
   > ⚠️ `.env` is git-ignored — never commit real credentials.

---

## 7. How to Run the Project

Run these commands from the project's root folder.

| Command | What it does |
|---|---|
| `npm run daraz-login` | Runs the login test with the browser visible (headed) |
| `npm run daraz-login-headless` | Runs the login test with no visible browser (headless) |
| `npm run daraz-full-flow` | Runs the full flow (login → search → cart → checkout) with the browser visible |
| `npm run daraz-full-flow-headless` | Runs the full flow with no visible browser (ideal for CI) |
| `npm run report:playwright:show` | Opens the last generated HTML report in your browser |

**Example — run the full shopping flow and see the browser in action:**
```bash
npm run daraz-full-flow
```

**Example — view the test report after a run:**
```bash
npm run report:playwright:show
```

---

## 8. Test Data Handling

All product prices, discounts, and price-related calculations are stored in **JSON files** inside the `data/` folder — not hardcoded inside the test scripts.

- `data/testData.json` — what to search for (product keywords) and the fixed platform fee.
- `data/priceData.json` — actual prices captured live from the website during the test run, plus the final calculated totals (discount, subtotal, shipping, total).

**Why this matters:**
- Keeps the test code clean, readable, and free of "magic numbers."
- Makes it easy to update expected values without touching automation logic.
- Test data and calculation logic (`tests/utils/PriceCalculator.ts`) are kept separate, following good testing practice.

---

## 9. Key Validations

The automation performs the following validations during the checkout flow:

- ✅ **Price validation** — the discounted and original price captured on the product page match what's later shown in the cart.
- ✅ **Discount calculation** — discount = (price without discount) − (price with discount), verified against JSON data.
- ✅ **Subtotal validation** — subtotal = sum of (price × quantity) for all cart items, checked against the live cart.
- ✅ **Shipping cost calculation** — the live shipping fee shown in the cart is captured and used to validate the final total.
- ✅ **Total amount verification** — total = subtotal + shipping, verified on both the Cart page and the Checkout page's Order Summary (Items Total, Delivery Fee, Platform Fee, Total Amount).

> 🛑 **Note:** The test stops right after validating the Checkout page's Order Summary. It never clicks **"Proceed to Pay,"** so no real payment or order is ever placed.

---

## Need Help?

If you run into any issues while setting up or running this project, check:
- `.env` file is correctly filled in with valid Daraz credentials.
- You've run `npx playwright install` at least once.
- The last HTML report (`npm run report:playwright:show`) for detailed failure screenshots and traces.
