import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as USD currency.
 */
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

/**
 * Formats a number as VND currency (for display only).
 */
export function formatVND(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Math.round(num));
}

// Cache exchange rate for 10 minutes
let cachedRate: { rate: number; timestamp: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Fetches the current USD → VND exchange rate from a free API.
 * Results are cached for 10 minutes.
 */
export async function getUsdToVndRate(): Promise<number> {
  if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_TTL) {
    return cachedRate.rate;
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await res.json();
    const rate = data?.rates?.VND ?? 25000; // fallback
    cachedRate = { rate, timestamp: Date.now() };
    return rate;
  } catch {
    return cachedRate?.rate ?? 25000; // fallback on error
  }
}

/**
 * Converts a USD amount to VND using live exchange rate.
 */
export async function convertUsdToVnd(amountUsd: number): Promise<number> {
  const rate = await getUsdToVndRate();
  return amountUsd * rate;
}
