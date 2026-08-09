// Shared shaping helpers for the trade ticket. Extracted verbatim from the old
// trade-form-dialog so the market branching and the datetime handling keep
// behaving exactly as before.

export const TRADE_ASSET_TYPES = [
  { value: "FOREX", label: "Forex" },
  { value: "COMMODITY", label: "Komoditas (XAU/XAG)" },
  { value: "STOCK_IDX", label: "Saham IDX" },
  { value: "STOCK_US", label: "Saham US" },
  { value: "CRYPTO_SPOT", label: "Crypto Spot" },
  { value: "CRYPTO_FUTURES", label: "Crypto Futures" },
] as const;

const FOREX_SYMBOLS = ["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD"];
const COMMODITY_SYMBOLS = ["XAUUSD", "XAGUSD", "USOIL", "UKOIL"];
const CRYPTO_SYMBOLS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT"];

export function getSymbolSuggestions(mt: string): string[] {
  if (mt === "FOREX") return FOREX_SYMBOLS;
  if (mt === "COMMODITY") return COMMODITY_SYMBOLS;
  if (mt === "CRYPTO_SPOT" || mt === "CRYPTO_FUTURES") return CRYPTO_SYMBOLS;
  return [];
}

export function isForexOrCommodity(mt: string) {
  return mt === "FOREX" || mt === "COMMODITY";
}
export function isStock(mt: string) {
  return mt === "STOCK_IDX" || mt === "STOCK_US";
}
export function isCryptoFutures(mt: string) {
  return mt === "CRYPTO_FUTURES";
}
export function isMultiLayerSupported(mt: string) {
  return mt === "FOREX" || mt === "COMMODITY";
}

// Converts an ISO datetime string to the "YYYY-MM-DDTHH:mm" shape
// <input type="datetime-local"> expects, in local time.
export function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function numStr(v: number | null | undefined): string {
  return v === null || v === undefined ? "" : String(v);
}

// Human-readable gap between two datetime-local values, for the ticket footer.
export function formatDuration(openTime: string, closeTime: string): string | null {
  if (!openTime || !closeTime) return null;
  const ms = new Date(closeTime).getTime() - new Date(openTime).getTime();
  if (isNaN(ms) || ms < 0) return null;

  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}j ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}h ${hours % 24}j`;
}
