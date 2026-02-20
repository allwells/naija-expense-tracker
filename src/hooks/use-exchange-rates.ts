"use client";

import useSWR from "swr";

interface RatesPayload {
  rates: Record<string, number>;
  timestamp: string;
}

interface ApiResponse {
  data: RatesPayload | null;
  error: string | null;
}

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => r.json())
    .then((json: ApiResponse) => json.data);

export function useExchangeRates() {
  const { data, error, isLoading, mutate } = useSWR<RatesPayload | null>(
    "/api/exchange-rates",
    fetcher,
    { refreshInterval: 3_600_000 }, // refresh every hour
  );

  return {
    rates: data?.rates ?? {},
    lastUpdated: data?.timestamp,
    isLoading,
    error: error as Error | undefined,
    refresh: () => mutate(),
    getRate: (from: string, to = "NGN"): number | null =>
      data?.rates[`${from}_${to}`] ?? null,
  };
}
