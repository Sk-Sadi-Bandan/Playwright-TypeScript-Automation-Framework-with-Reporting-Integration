import fs from 'fs';
import path from 'path';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * PRICE DATA STORE
 * Single Responsibility Principle: All reading/writing of the /data JSON
 * fixtures lives here so page objects and tests never touch fs directly.
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface TestDataProduct {
  id: string;
  searchKeyword: string;
}

export interface TestData {
  products: TestDataProduct[];
  platformFee: number;
}

export interface PriceDataProduct {
  id: string;
  searchKeyword: string;
  name: string | null;
  priceWithDiscount: number | null;
  priceWithoutDiscount: number | null;
  quantity: number | null;
}

export interface PriceCalculations {
  totalWithoutDiscountPrice: number | null;
  totalWithDiscountPrice: number | null;
  discount: number | null;
  subtotal: number | null;
  totalShippingCost: number | null;
  totalPrice: number | null;
}

export interface PriceData {
  products: PriceDataProduct[];
  calculations: PriceCalculations;
}

const DATA_DIR = path.resolve(__dirname, '../../data');
const TEST_DATA_FILE = path.join(DATA_DIR, 'testData.json');
const PRICE_DATA_FILE = path.join(DATA_DIR, 'priceData.json');

export function readTestData(): TestData {
  return JSON.parse(fs.readFileSync(TEST_DATA_FILE, 'utf-8'));
}

export function readPriceData(): PriceData {
  return JSON.parse(fs.readFileSync(PRICE_DATA_FILE, 'utf-8'));
}

export function writePriceData(data: PriceData): void {
  fs.writeFileSync(PRICE_DATA_FILE, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}
