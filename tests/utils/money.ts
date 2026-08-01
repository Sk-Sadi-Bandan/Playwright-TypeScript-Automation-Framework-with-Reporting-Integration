/**
 * ════════════════════════════════════════════════════════════════════════════
 * MONEY PARSING HELPER
 * Daraz renders prices like "৳ 1,850", but callers often read a whole row's
 * textContent (e.g. "Subtotal (1 items)৳ 296"), which mixes in unrelated
 * digits like the item count. Extract the ৳-prefixed number specifically
 * rather than stripping non-digits from the full string.
 * ════════════════════════════════════════════════════════════════════════════
 */
export function parseAmount(text: string): number {
  const match = text.match(/৳\s?(-?[\d,]+(?:\.\d+)?)/);
  const numeric = (match ? match[1] : text.replace(/[^\d.-]/g, '')).replace(/,/g, '');
  const value = Number(numeric);
  if (Number.isNaN(value)) {
    throw new Error(`Unable to parse a numeric amount from "${text}"`);
  }
  return value;
}
