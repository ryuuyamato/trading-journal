import { formatCentWithUsd } from "@/lib/utils";

// Shared by the desktop table and the phone card list so both render a trade
// identically. Extracted from trades-table.tsx unchanged.

export function formatPnl(v: number | null, currency = "USD") {
  if (v === null) return "–";
  const prefix = v >= 0 ? "+" : "";
  if (currency === "IDR") {
    return `${prefix}Rp ${Math.abs(v).toLocaleString("id-ID")}`;
  }
  if (currency === "USC") return formatCentWithUsd(Math.abs(v), prefix);
  return `${prefix}$${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatTradeDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Jakarta",
  });
}

export function formatDateRange(openTime: string, closeTime: string | null) {
  const open = formatTradeDate(openTime);
  return closeTime ? `${open} → ${formatTradeDate(closeTime)}` : open;
}

export function directionLabel(direction: string, marketType: string | null) {
  const isCrypto = marketType === "CRYPTO_SPOT" || marketType === "CRYPTO_FUTURES";
  if (isCrypto) return direction === "LONG" ? "Long" : "Short";
  return direction === "LONG" ? "Buy" : "Sell";
}

// The market type actually shown for a trade: multi-asset accounts store it per
// trade, everything else inherits the account's.
export function effectiveMarketType(trade: {
  account: { marketType: string };
  tradeMarketType: string | null;
}): string {
  return trade.account.marketType === "MULTI_ASSET" && trade.tradeMarketType
    ? trade.tradeMarketType
    : trade.account.marketType;
}
