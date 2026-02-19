---
name: currency-fx
description: Multi-currency handling and live exchange rate integration for USD, EUR, GBP → NGN conversion. Use when building the exchange rate service, DB caching layer (1hr TTL), the /api/exchange-rates route, the useExchangeRates client hook, in-form auto-conversion when a user selects a foreign currency, or the dashboard rate banner. Includes fallback rates and formatNGN utility.
---

# SKILL: Multi-Currency & Exchange Rates

## Purpose

Handle USD, EUR, GBP → NGN conversion with live rates, DB caching, and graceful fallbacks.

## Architecture

```
API Route (/api/exchange-rates) ← fetches from ExchangeRate-API
         ↓ caches in exchange_rates table (1hr TTL)
Exchange Rate Service (src/lib/exchange-rate-service.ts)
         ↓
useExchangeRates hook (client) + server actions (mutations)
```

## Exchange Rate Service

```typescript
// src/lib/exchange-rate-service.ts
import { createServiceClient } from "@/lib/supabase";

export const SUPPORTED_CURRENCIES = ["NGN", "USD", "EUR", "GBP"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

const FALLBACK_RATES: Record<string, number> = {
  USD_NGN: 1580,
  EUR_NGN: 1720,
  GBP_NGN: 2020,
};

const CACHE_TTL_HOURS = 1;

export async function getExchangeRate(
  from: string,
  to: string = "NGN",
): Promise<number> {
  if (from === to) return 1;

  const supabase = createServiceClient();
  const cacheKey = `${from}_${to}`;

  // Check cache
  const { data: cached } = await supabase
    .from("exchange_rates")
    .select("rate, fetched_at")
    .eq("base_currency", from)
    .eq("target_currency", to)
    .single();

  if (cached) {
    const ageHours =
      (Date.now() - new Date(cached.fetched_at).getTime()) / 3600000;
    if (ageHours < CACHE_TTL_HOURS) return cached.rate;
  }

  // Fetch fresh rate
  try {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    const res = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${from}/${to}`,
      { next: { revalidate: 3600 } },
    );

    if (!res.ok) throw new Error("API fetch failed");
    const json = await res.json();
    const rate = json.conversion_rate as number;

    // Upsert cache
    await supabase.from("exchange_rates").upsert({
      base_currency: from,
      target_currency: to,
      rate,
      fetched_at: new Date().toISOString(),
    });

    return rate;
  } catch {
    // Return fallback or cached stale rate
    if (cached) return cached.rate;
    return FALLBACK_RATES[cacheKey] ?? 1;
  }
}

export async function convertToNGN(
  amount: number,
  fromCurrency: string,
): Promise<{ amountNGN: number; rate: number }> {
  if (fromCurrency === "NGN") return { amountNGN: amount, rate: 1 };
  const rate = await getExchangeRate(fromCurrency, "NGN");
  return { amountNGN: amount * rate, rate };
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
```

## API Route

```typescript
// src/app/api/exchange-rates/route.ts
import { NextResponse } from "next/server";
import { getAllRates } from "@/lib/exchange-rate-service";

export async function GET() {
  try {
    const rates = await getAllRates();
    return NextResponse.json({ rates, timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch rates" },
      { status: 500 },
    );
  }
}
```

## Client Hook

```typescript
// src/hooks/use-exchange-rates.ts
"use client";
import useSWR from "swr";

interface RatesResponse {
  rates: Record<string, number>;
  timestamp: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useExchangeRates() {
  const { data, error, isLoading } = useSWR<RatesResponse>(
    "/api/exchange-rates",
    fetcher,
    { refreshInterval: 3_600_000 }, // refresh every hour
  );

  return {
    rates: data?.rates ?? {},
    lastUpdated: data?.timestamp,
    isLoading,
    error,
    getRate: (from: string, to = "NGN") => data?.rates[`${from}_${to}`] ?? null,
  };
}
```

## In-Form Currency Conversion

When user selects a foreign currency and enters an amount, auto-convert:

```typescript
// Inside use-expense-form.ts
const { getRate } = useExchangeRates();

// Watch originalCurrency + originalAmount fields
useEffect(() => {
  const currency = form.watch("original_currency");
  const amount = form.watch("original_amount");
  if (currency && currency !== "NGN" && amount) {
    const rate = getRate(currency);
    if (rate) {
      form.setValue("amount_ngn", Math.round(amount * rate));
      form.setValue("exchange_rate", rate);
    }
  }
}, [form.watch("original_currency"), form.watch("original_amount")]);
```

## Display Format

Always display NGN amounts with:

```typescript
export function formatNGN(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
```

## Dashboard Rate Banner

Show live rates prominently on dashboard:

```
USD/NGN: ₦1,580.00  •  EUR/NGN: ₦1,720.00  •  Updated 2 mins ago
```
