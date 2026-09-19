/**
 * Strips everything but digits and caps the length — used on every plain
 * numeric field (budget, price, size, deal value, etc.) so users can't type
 * or paste separators like "," "-" "." "e", and can't exceed a sane length.
 */
export function sanitizeDigits(value: string, maxLength = 10): string {
  return value.replace(/\D/g, '').slice(0, maxLength)
}
