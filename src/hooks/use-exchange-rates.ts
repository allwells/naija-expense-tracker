"use client";

import useSWR from "swr";
import { useCallback } from "react";

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
  const { data, error, isLoading, isValidating, mutate } =
    useSWR<RatesPayload | null>(
      "/api/exchange-rates",
      fetcher,
      { refreshInterval: 21_600_000 }, // refresh every 6 hours
    );

  const refresh = useCallback(
    async (force = false) => {
      if (!force) {
        return mutate();
      }

      const res = await fetch("/api/exchange-rates?force=true");
      const json = await res.json();
      return mutate(json.data);
    },
    [mutate],
  );

  return {
    rates: data?.rates ?? {},
    lastUpdated: data?.timestamp,
    isLoading: isLoading || isValidating,
    error: error as Error | undefined,
    refresh,
    getRate: (from: string, to = "NGN"): number | null =>
      data?.rates[`${from}_${to}`] ?? null,
  };
}
