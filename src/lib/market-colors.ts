// Single source of truth for how each market type is labelled and colour-coded.
// Previously duplicated between the sidebar and the dashboard page, which let
// the two drift apart.

export const MARKET_LABEL: Record<string, string> = {
  FOREX: "Forex",
  COMMODITY: "Komoditas",
  STOCK_IDX: "Saham IDX",
  STOCK_US: "Saham US",
  CRYPTO_SPOT: "Crypto Spot",
  CRYPTO_FUTURES: "Crypto Futures",
  MULTI_ASSET: "Multi Aset",
};

// Deliberately avoids the profit green and loss red so an account dot is never
// mistaken for a P&L signal.
export const MARKET_DOT_COLORS: Record<string, string> = {
  FOREX: "#4A7DFF",
  COMMODITY: "#F0B90B",
  STOCK_IDX: "#00B8D9",
  STOCK_US: "#7C5CE0",
  CRYPTO_SPOT: "#A78BFA",
  CRYPTO_FUTURES: "#E06C9F",
  MULTI_ASSET: "#F8A33C",
};

export function marketLabel(marketType: string): string {
  return MARKET_LABEL[marketType] ?? marketType;
}

export function marketDotColor(marketType: string): string {
  return MARKET_DOT_COLORS[marketType] ?? "#848E9C";
}
