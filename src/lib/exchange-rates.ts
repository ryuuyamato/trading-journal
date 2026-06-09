export interface ExchangeRates {
  usdToIdr: number;
  usdToEur: number; // used to derive EUR → IDR
  date: string;
}

export async function getExchangeRates(): Promise<ExchangeRates | null> {
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=IDR,EUR", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json() as { rates: { IDR: number; EUR: number }; date: string };
    return {
      usdToIdr: data.rates.IDR,
      usdToEur: data.rates.EUR,
      date: data.date,
    };
  } catch {
    return null;
  }
}

/**
 * Convert an account balance to IDR.
 * Returns null if the currency is unrecognised or rates are unavailable.
 */
export function toIdr(amount: number, currency: string, rates: ExchangeRates): number | null {
  switch (currency) {
    case "IDR":  return amount;
    case "USD":  return amount * rates.usdToIdr;
    case "USDT": return amount * rates.usdToIdr;          // stablecoin 1:1 USD
    case "USC":  return (amount / 100) * rates.usdToIdr;  // USD cents → USD → IDR
    case "EUR":  return (amount / rates.usdToEur) * rates.usdToIdr;
    default:     return null;
  }
}

export function formatIdr(amount: number): string {
  return `Rp ${Math.round(amount).toLocaleString("id-ID")}`;
}
