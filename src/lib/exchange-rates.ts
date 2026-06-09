export interface ExchangeRates {
  usdToIdr: number;
  date: string;
}

export async function getExchangeRates(): Promise<ExchangeRates | null> {
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=IDR", {
      next: { revalidate: 3600 }, // cache 1 hour
    });
    if (!res.ok) return null;
    const data = await res.json() as { rates: { IDR: number }; date: string };
    return { usdToIdr: data.rates.IDR, date: data.date };
  } catch {
    return null;
  }
}

/** Convert an account balance to IDR. Returns null if currency is unknown or rates unavailable. */
export function toIdr(amount: number, currency: string, rates: ExchangeRates): number | null {
  if (currency === "IDR") return amount;
  if (currency === "USD") return amount * rates.usdToIdr;
  if (currency === "USC") return (amount / 100) * rates.usdToIdr; // USD cents
  return null; // unknown currency
}

export function formatIdr(amount: number): string {
  return `Rp ${Math.round(amount).toLocaleString("id-ID")}`;
}
