export const CURRENCY_INSTRUMENTS: Record<string, string[]> = {
  USD: ["XAU/USD", "EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", "NZD/USD", "USD/CAD", "NASDAQ", "S&P500", "WTI"],
  EUR: ["EUR/USD", "EUR/GBP", "EUR/JPY", "EUR/CHF", "EUR/AUD", "EUR/CAD", "GER40"],
  GBP: ["GBP/USD", "EUR/GBP", "GBP/JPY", "GBP/CHF", "GBP/AUD", "GBP/CAD", "UK100"],
  JPY: ["USD/JPY", "EUR/JPY", "GBP/JPY", "AUD/JPY", "CAD/JPY", "Nikkei225"],
  CHF: ["USD/CHF", "EUR/CHF", "GBP/CHF", "CHF/JPY"],
  AUD: ["AUD/USD", "AUD/JPY", "AUD/NZD", "AUD/CAD", "AUD/CHF", "ASX200"],
  NZD: ["NZD/USD", "AUD/NZD", "NZD/JPY", "NZD/CAD"],
  CAD: ["USD/CAD", "EUR/CAD", "GBP/CAD", "AUD/CAD", "CAD/JPY", "CAD/CHF"],
  CNY: ["USD/CNH", "AUD/USD", "XAU/USD"],
  CNH: ["USD/CNH"],
};

export function getInstrumentsForCurrency(country: string): string[] {
  const currency = COUNTRY_CURRENCY[country.toUpperCase()] ?? country.toUpperCase();
  return CURRENCY_INSTRUMENTS[currency] ?? [];
}

const COUNTRY_CURRENCY: Record<string, string> = {
  USD: "USD",
  US: "USD",
  EUR: "EUR",
  EMU: "EUR",
  EU: "EUR",
  GBP: "GBP",
  UK: "GBP",
  GB: "GBP",
  JPY: "JPY",
  JP: "JPY",
  CHF: "CHF",
  CH: "CHF",
  AUD: "AUD",
  AU: "AUD",
  NZD: "NZD",
  NZ: "NZD",
  CAD: "CAD",
  CA: "CAD",
  CNY: "CNY",
  CN: "CNY",
  CNH: "CNH",
};
