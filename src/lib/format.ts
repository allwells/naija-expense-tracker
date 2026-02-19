/**
 * Format a number as Nigerian Naira (₦).
 * @param amount - The amount in NGN
 * @param compact - If true, shows ₦1.2M or ₦500K for large values
 */
export function formatNGN(amount: number, compact = false): string {
  if (compact && amount >= 1_000_000) {
    return `₦${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (compact && amount >= 1_000) {
    return `₦${(amount / 1_000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
}
