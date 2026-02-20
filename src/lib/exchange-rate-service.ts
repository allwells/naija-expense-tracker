import { createServiceClient } from "@/lib/supabase";

export const SUPPORTED_CURRENCIES = ["NGN", "USD", "EUR", "GBP"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

const FALLBACK_RATES: Record<string, number> = {
  USD_NGN: 1352,
  GBP_NGN: 1939,
  EUR_NGN: 1689,
};

const CACHE_TTL_HOURS = 1;

export async function getExchangeRate(
  from: string,
  to: string = "NGN",
): Promise<number> {
  if (from === to) return 1;

  const supabase = createServiceClient();
  const cacheKey = `${from}_${to}`;

  // Check cache first
  const { data: cached } = await supabase
    .from("exchange_rates")
    .select("rate, fetched_at")
    .eq("base_currency", from)
    .eq("target_currency", to)
    .maybeSingle();

  if (cached) {
    const ageHours =
      (Date.now() - new Date(cached.fetched_at as string).getTime()) / 3600000;
    if (ageHours < CACHE_TTL_HOURS) return cached.rate as number;
  }

  // Fetch fresh rate from ExchangeRate-API
  try {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    if (!apiKey) throw new Error("EXCHANGE_RATE_API_KEY not configured");

    const res = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${from}/${to}`,
      { next: { revalidate: 3600 } },
    );

    if (!res.ok) throw new Error("API fetch failed");

    const json = (await res.json()) as { conversion_rate: number };
    const rate = json.conversion_rate;

    // Upsert into cache
    await supabase.from("exchange_rates").upsert(
      {
        base_currency: from,
        target_currency: to,
        rate,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "base_currency,target_currency" },
    );

    return rate;
  } catch {
    // Return stale cached rate if available, else fallback
    if (cached) return cached.rate as number;
    return FALLBACK_RATES[cacheKey] ?? 1;
  }
}

export async function convertToNGN(
  amount: number,
  fromCurrency: string,
): Promise<{ amountNGN: number; rate: number }> {
  if (fromCurrency === "NGN") return { amountNGN: amount, rate: 1 };
  const rate = await getExchangeRate(fromCurrency, "NGN");
  return { amountNGN: Math.round(amount * rate * 100) / 100, rate };
}

export async function getAllRates(): Promise<Record<string, number>> {
  const currencies = ["USD", "EUR", "GBP"];
  const rates: Record<string, number> = {};

  await Promise.all(
    currencies.map(async (c) => {
      rates[`${c}_NGN`] = await getExchangeRate(c, "NGN");
    }),
  );

  return rates;
}
