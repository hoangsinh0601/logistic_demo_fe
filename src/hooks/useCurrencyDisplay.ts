import { useState, useEffect, useCallback } from "react";
import { getUsdToVndRate, formatCurrency, formatVND } from "@/lib/utils";

type DisplayCurrency = "USD" | "VND";

/**
 * Compact-format large VND values:
 * - >= 1 tỷ (1B) → "1.2 tỷ ₫"
 * - >= 1 triệu (1M) → "25 tr ₫"
 * - else → full number
 */
function formatCompactVND(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1e9) {
    return `${sign}${(abs / 1e9).toFixed(1)} tỷ ₫`;
  }
  if (abs >= 1e6) {
    return `${sign}${(abs / 1e6).toFixed(1)} tr ₫`;
  }
  if (abs >= 1e3) {
    return `${sign}${(abs / 1e3).toFixed(0)}K ₫`;
  }
  return formatVND(amount);
}

interface CurrencyDisplay {
  /** Current display currency */
  currency: DisplayCurrency;
  /** Toggle between USD and VND */
  toggle: () => void;
  /** Format a USD amount in the selected display currency (full precision) */
  format: (amountUsd: string | number) => string;
  /** Format a USD amount in compact/abbreviated form (for cards, small spaces) */
  formatShort: (amountUsd: string | number) => string;
  /** Whether the exchange rate is still loading */
  isLoading: boolean;
  /** Current exchange rate (1 USD = X VND) */
  rate: number | null;
}

/**
 * Hook to manage USD ↔ VND display toggling.
 * All amounts are stored in USD; this hook handles conversion for display.
 */
export function useCurrencyDisplay(): CurrencyDisplay {
  const [currency, setCurrency] = useState<DisplayCurrency>("USD");
  const [rate, setRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch exchange rate when switching to VND
  useEffect(() => {
    if (currency === "VND" && rate === null) {
      setIsLoading(true);
      getUsdToVndRate()
        .then((r) => setRate(r))
        .finally(() => setIsLoading(false));
    }
  }, [currency, rate]);

  const toggle = useCallback(() => {
    setCurrency((prev) => (prev === "USD" ? "VND" : "USD"));
  }, []);

  const format = useCallback(
    (amountUsd: string | number): string => {
      const num =
        typeof amountUsd === "string" ? parseFloat(amountUsd) : amountUsd;
      if (isNaN(num)) return currency === "USD" ? "$0.00" : "0 ₫";

      if (currency === "VND" && rate !== null) {
        return formatVND(num * rate);
      }
      return formatCurrency(num);
    },
    [currency, rate],
  );

  const formatShort = useCallback(
    (amountUsd: string | number): string => {
      const num =
        typeof amountUsd === "string" ? parseFloat(amountUsd) : amountUsd;
      if (isNaN(num)) return currency === "USD" ? "$0" : "0 ₫";

      if (currency === "VND" && rate !== null) {
        return formatCompactVND(num * rate);
      }
      // Compact USD for large values too
      const abs = Math.abs(num);
      const sign = num < 0 ? "-" : "";
      if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(1)}B`;
      if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(1)}M`;
      if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(0)}K`;
      return formatCurrency(num);
    },
    [currency, rate],
  );

  return { currency, toggle, format, formatShort, isLoading, rate };
}
