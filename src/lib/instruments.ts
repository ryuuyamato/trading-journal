// Instrument reference data for the lot & risk calculator.
//
// These are conventional broker values, not live feed data — contract size, pip
// size and quote currency vary between brokers, especially for indices and
// crypto. Every screen that shows a derived figure also shows the assumptions,
// so a mismatch is visible before it becomes a bad position size.

export interface Instrument {
  symbol: string;
  /** Units of the base asset in one 1.00 lot. */
  contractSize: number;
  /** One pip expressed as a price move. */
  pipSize: number;
  /** Price decimals used for display. */
  digits: number;
  /** Currency the instrument is priced in. */
  quote: string;
  /** Indicative price, used to seed the entry/SL/TP fields. */
  refPrice: number;
}

type Row = [string, number, number, number, string, number];

const group = (rows: Row[]): Instrument[] =>
  rows.map(([symbol, contractSize, pipSize, digits, quote, refPrice]) => ({
    symbol,
    contractSize,
    pipSize,
    digits,
    quote,
    refPrice,
  }));

export const INSTRUMENT_GROUPS: Record<string, Instrument[]> = {
  "Forex — Major": group([
    ["EURUSD", 100000, 0.0001, 5, "USD", 1.085],
    ["GBPUSD", 100000, 0.0001, 5, "USD", 1.27],
    ["USDJPY", 100000, 0.01, 3, "JPY", 155.0],
    ["USDCHF", 100000, 0.0001, 5, "CHF", 0.89],
    ["USDCAD", 100000, 0.0001, 5, "CAD", 1.37],
    ["AUDUSD", 100000, 0.0001, 5, "USD", 0.66],
    ["NZDUSD", 100000, 0.0001, 5, "USD", 0.6],
  ]),
  "Forex — Cross": group([
    ["EURGBP", 100000, 0.0001, 5, "GBP", 0.855],
    ["EURJPY", 100000, 0.01, 3, "JPY", 168.0],
    ["EURCHF", 100000, 0.0001, 5, "CHF", 0.965],
    ["EURAUD", 100000, 0.0001, 5, "AUD", 1.64],
    ["EURCAD", 100000, 0.0001, 5, "CAD", 1.49],
    ["EURNZD", 100000, 0.0001, 5, "NZD", 1.8],
    ["GBPJPY", 100000, 0.01, 3, "JPY", 196.0],
    ["GBPCHF", 100000, 0.0001, 5, "CHF", 1.13],
    ["GBPAUD", 100000, 0.0001, 5, "AUD", 1.92],
    ["GBPCAD", 100000, 0.0001, 5, "CAD", 1.74],
    ["GBPNZD", 100000, 0.0001, 5, "NZD", 2.11],
    ["AUDJPY", 100000, 0.01, 3, "JPY", 102.0],
    ["AUDCHF", 100000, 0.0001, 5, "CHF", 0.59],
    ["AUDCAD", 100000, 0.0001, 5, "CAD", 0.9],
    ["AUDNZD", 100000, 0.0001, 5, "NZD", 1.1],
    ["NZDJPY", 100000, 0.01, 3, "JPY", 93.0],
    ["NZDCHF", 100000, 0.0001, 5, "CHF", 0.535],
    ["NZDCAD", 100000, 0.0001, 5, "CAD", 0.82],
    ["CADJPY", 100000, 0.01, 3, "JPY", 113.0],
    ["CADCHF", 100000, 0.0001, 5, "CHF", 0.65],
    ["CHFJPY", 100000, 0.01, 3, "JPY", 174.0],
  ]),
  "Forex — Exotic": group([
    ["USDMXN", 100000, 0.0001, 5, "MXN", 20.5],
    ["USDZAR", 100000, 0.0001, 5, "ZAR", 18.2],
    ["USDTRY", 100000, 0.0001, 5, "TRY", 40.0],
    ["USDSEK", 100000, 0.0001, 5, "SEK", 10.9],
    ["USDNOK", 100000, 0.0001, 5, "NOK", 11.0],
    ["USDSGD", 100000, 0.0001, 5, "SGD", 1.35],
    ["USDHKD", 100000, 0.0001, 5, "HKD", 7.8],
    ["USDPLN", 100000, 0.0001, 5, "PLN", 4.0],
    ["USDHUF", 100000, 0.01, 3, "HUF", 360.0],
    ["USDCZK", 100000, 0.0001, 5, "CZK", 23.5],
    ["USDCNH", 100000, 0.0001, 5, "CNH", 7.25],
    ["USDTHB", 100000, 0.0001, 5, "THB", 34.5],
    ["EURTRY", 100000, 0.0001, 5, "TRY", 43.5],
    ["EURPLN", 100000, 0.0001, 5, "PLN", 4.3],
    ["EURSEK", 100000, 0.0001, 5, "SEK", 11.8],
    ["EURNOK", 100000, 0.0001, 5, "NOK", 11.9],
  ]),
  "Logam mulia": group([
    ["XAUUSD", 100, 0.1, 2, "USD", 3350],
    ["XAGUSD", 5000, 0.01, 3, "USD", 38.0],
    ["XPTUSD", 100, 0.1, 2, "USD", 1050],
    ["XPDUSD", 100, 0.1, 2, "USD", 1000],
    ["XAUEUR", 100, 0.1, 2, "EUR", 3080],
    ["XAUAUD", 100, 0.1, 2, "AUD", 5100],
  ]),
  Energi: group([
    ["USOIL · WTI", 1000, 0.01, 2, "USD", 68.0],
    ["UKOIL · Brent", 1000, 0.01, 2, "USD", 72.0],
    ["NATGAS", 10000, 0.001, 3, "USD", 3.2],
  ]),
  Indeks: group([
    ["US30 · Dow", 1, 1, 2, "USD", 44000],
    ["NAS100", 1, 1, 2, "USD", 20500],
    ["SPX500", 1, 1, 2, "USD", 5900],
    ["US2000 · Russell", 1, 1, 2, "USD", 2300],
    ["GER40 · DAX", 1, 1, 2, "EUR", 20000],
    ["UK100 · FTSE", 1, 1, 2, "GBP", 8300],
    ["FRA40 · CAC", 1, 1, 2, "EUR", 7600],
    ["EU50 · Stoxx", 1, 1, 2, "EUR", 5000],
    ["ESP35 · IBEX", 1, 1, 2, "EUR", 11800],
    ["ITA40 · MIB", 1, 1, 2, "EUR", 34000],
    ["SWI20 · SMI", 1, 1, 2, "CHF", 11800],
    ["NETH25 · AEX", 1, 1, 2, "EUR", 900],
    ["JP225 · Nikkei", 1, 1, 2, "JPY", 39000],
    ["AUS200 · ASX", 1, 1, 2, "AUD", 8400],
    ["HK50 · HangSeng", 1, 1, 2, "HKD", 20000],
    ["CHINA50", 1, 1, 2, "USD", 13500],
  ]),
  Kripto: group([
    ["BTCUSD", 1, 1, 2, "USD", 95000],
    ["ETHUSD", 1, 0.1, 2, "USD", 3400],
    ["BNBUSD", 1, 0.1, 2, "USD", 650],
    ["SOLUSD", 1, 0.01, 3, "USD", 180],
    ["LTCUSD", 1, 0.01, 3, "USD", 100],
    ["XRPUSD", 1, 0.0001, 5, "USD", 2.2],
    ["ADAUSD", 1, 0.0001, 5, "USD", 0.9],
    ["DOGEUSD", 1, 0.0001, 5, "USD", 0.35],
  ]),
};

// Indicative value of one unit of each quote currency in USD. Only used to seed
// the field — the calculator surfaces it as an editable input precisely because
// these drift, and sizing is only as accurate as this number.
export const QUOTE_TO_USD: Record<string, number> = {
  USD: 1,
  EUR: 1.09,
  GBP: 1.27,
  JPY: 0.00645,
  CHF: 1.12,
  CAD: 0.73,
  AUD: 0.66,
  NZD: 0.6,
  HKD: 0.128,
  MXN: 0.049,
  ZAR: 0.055,
  TRY: 0.025,
  SEK: 0.092,
  NOK: 0.091,
  SGD: 0.74,
  PLN: 0.25,
  HUF: 0.0028,
  CZK: 0.043,
  CNH: 0.138,
  THB: 0.029,
};

export const DEFAULT_INSTRUMENT_KEY = "Logam mulia|XAUUSD";

export function instrumentKey(groupName: string, symbol: string): string {
  return `${groupName}|${symbol}`;
}

export function findInstrument(key: string): Instrument | undefined {
  const [groupName, symbol] = key.split("|");
  return INSTRUMENT_GROUPS[groupName]?.find((i) => i.symbol === symbol);
}

// A USDXXX pair prices one USD in the quote currency, so the quote's USD value
// is simply 1/price — no external rate needed, and it tracks the entry field.
export function derivesQuoteRateFromPrice(inst: Instrument): boolean {
  return inst.quote !== "USD" && /^USD[A-Z]{3}$/.test(inst.symbol.replace(/\s.*$/, ""));
}
