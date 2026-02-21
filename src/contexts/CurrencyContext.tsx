"use client";

import { createContext, useContext, useMemo } from "react";
import { useExchangeRates } from "@/hooks/use-exchange-rates";
import { formatAmount, getCurrencySymbol } from "@/lib/format";

interface CurrencyContextValue {
  currency: string;
  isLoading: boolean;
  refreshRates: (force?: boolean) => void;
  /**
   * Converts an NGN amount to the user's preferred currency
   * and returns the formatted string (with symbol).
   */
  format: (amountNgn: number, compact?: boolean) => string;
  /**
   * Returns just the raw converted numerical value.
   */
  convert: (amountNgn: number) => number;
  /**
   * Return the currency symbol
   */
  symbol: string;
  /**
   * Converts user's preferred currency back to NGN.
   */
  convertToNgn: (amountUserCurrency: number) => number;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({
  children,
  userCurrency,
}: {
  children: React.ReactNode;
  userCurrency: string;
}) {
  const { getRate, isLoading, refresh } = useExchangeRates();

  const value = useMemo(() => {
    const convert = (amountNgn: number) => {
      // If the currency is NGN, no conversion needed
      if (userCurrency === "NGN") return amountNgn;
      // The DB stores rates as BASE_TARGET (e.g. USD_NGN = 1500)
      // So to convert NGN to USD, we divide by the USD_NGN rate.
      const rate = getRate(userCurrency, "NGN");
      if (!rate) return amountNgn; // Fallback to raw NGN if no rate available
      return amountNgn / rate;
    };

    const format = (amountNgn: number, compact = false) => {
      const converted = convert(amountNgn);
      return formatAmount(converted, userCurrency, compact);
    };

    const convertToNgn = (amountUserCurrency: number) => {
      if (userCurrency === "NGN") return amountUserCurrency;
      const rate = getRate(userCurrency, "NGN");
      if (!rate) return amountUserCurrency; // Fallback
      return amountUserCurrency * rate; // Since rate is target/base (e.g. 1500 for USD->NGN), we multiply.
    };

    return {
      currency: userCurrency,
      isLoading,
      refreshRates: refresh,
      format,
      convert,
      convertToNgn,
      symbol: getCurrencySymbol(userCurrency),
    };
  }, [userCurrency, getRate, isLoading, refresh]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
