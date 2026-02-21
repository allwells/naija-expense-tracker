/**
 * Format a number into the specified currency.
 * @param amount - The original amount (assumed to be NGN, but will be converted contextually)
 * @param currency - The target ISO currency code (e.g., 'USD', 'NGN')
 * @param compact - If true, shows ₦1.2M or ₦500K for large values
 */
export function formatAmount(
  amount: number,
  currency: string = "NGN",
  compact = false,
): string {
  if (compact && Math.abs(amount) >= 1_000_000) {
    // Get the localized symbol for the chosen currency.
    const formatter = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });
    // Extract just the symbol, e.g. "₦" or "$"
    const parts = formatter.formatToParts(0);
    const symbol = parts.find((p) => p.type === "currency")?.value || "";

    return `${symbol}${(amount / 1_000_000).toFixed(2)}M`;
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number into compact string like 2.3m, 233.4k, 5.23b
 * It keeps 1 or 2 decimal places for billions, 1 for millions, 1 for thousands depending on the size.
 * @param amount - The number to format
 */
export function formatCompactNumber(amount: number): string {
  if (amount === 0) return "0";

  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (absAmount >= 1_000_000_000) {
    return `${sign}${(absAmount / 1_000_000_000).toFixed(2).replace(/\.00$/, "")}b`;
  }
  if (absAmount >= 1_000_000) {
    return `${sign}${(absAmount / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  }
  if (absAmount >= 1_000) {
    return `${sign}${(absAmount / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  }

  return `${sign}${absAmount.toString()}`;
}
