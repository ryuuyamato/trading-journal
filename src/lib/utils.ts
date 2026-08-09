import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Cent ("USC") accounts: 100 cent = 1 USD — show the raw cent amount plus its USD equivalent.
export function formatCentWithUsd(absValue: number, sign: string) {
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${sign}¢${fmt(absValue)} (≈ ${sign}$${fmt(absValue / 100)})`;
}

// Balance/P&L in an account's own units. Kept separate from formatCurrency
// because "USC" (cent accounts) is not an ISO currency code and would make
// Intl.NumberFormat throw.
export function formatAccountAmount(amount: number, currency: string): string {
  if (currency === "IDR") return `Rp ${Math.round(amount).toLocaleString("id-ID")}`;
  if (currency === "USC") {
    const usd = amount / 100;
    return `$${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

// Signed P&L for headline readouts — always carries an explicit + or −.
export function formatSignedUsd(amount: number): string {
  const sign = amount >= 0 ? "+" : "−";
  return `${sign}$${Math.abs(amount).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(date))
}
