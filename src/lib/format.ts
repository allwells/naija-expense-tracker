export function getCurrencyLocale(currency: string): string {
  switch (currency) {
    case "USD":
      return "en-US";
    case "EUR":
      return "en-IE"; // English Ireland uses Euro
    case "GBP":
      return "en-GB";
    case "NGN":
    default:
      return "en-NG";
  }
}

export function getCurrencySymbol(currency: string): string {
  const locale = getCurrencyLocale(currency);
  const parts = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).formatToParts(0);
  return parts.find((p) => p.type === "currency")?.value || currency;
}

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
  const locale = getCurrencyLocale(currency);

  if (compact && Math.abs(amount) >= 1_000_000) {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${(amount / 1_000_000).toFixed(2)}M`;
  }

  return new Intl.NumberFormat(locale, {
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
    return `${sign}${Number((absAmount / 1_000_000_000).toFixed(2))}b`;
  }
  if (absAmount >= 1_000_000) {
    return `${sign}${Number((absAmount / 1_000_000).toFixed(2))}m`;
  }
  if (absAmount >= 1_000) {
    return `${sign}${Number((absAmount / 1_000).toFixed(2))}k`;
  }

  return `${sign}${Number(absAmount.toFixed(2))}`;
}
