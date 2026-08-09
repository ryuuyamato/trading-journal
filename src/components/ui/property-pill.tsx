import { cn } from "@/lib/utils";
import { MARKET_DOT_COLORS } from "@/lib/market-colors";

type PillVariant =
  | "forex"
  | "commodity"
  | "stock"
  | "stock_us"
  | "crypto"
  | "multi_asset"
  | "mode"
  | "profit"
  | "loss"
  | "neutral";

// Market pills carry a hue; the tint and ink are both derived from it at render
// time (see below) so one value serves both themes.
const VARIANT_HUE: Partial<Record<PillVariant, string>> = {
  forex: MARKET_DOT_COLORS.FOREX,
  commodity: MARKET_DOT_COLORS.COMMODITY,
  stock: MARKET_DOT_COLORS.STOCK_IDX,
  stock_us: MARKET_DOT_COLORS.STOCK_US,
  crypto: MARKET_DOT_COLORS.CRYPTO_SPOT,
  multi_asset: MARKET_DOT_COLORS.MULTI_ASSET,
};

// Semantic pills use theme tokens directly, so profit/loss always match the
// numbers they sit beside.
const TOKEN_CLASSES: Partial<Record<PillVariant, string>> = {
  profit: "bg-profit/12 text-profit",
  loss: "bg-loss/12 text-loss",
  mode: "bg-muted text-muted-foreground",
  neutral: "bg-muted text-muted-foreground",
};

const MARKET_TO_VARIANT: Record<string, PillVariant> = {
  FOREX: "forex",
  COMMODITY: "commodity",
  STOCK_IDX: "stock",
  STOCK_US: "stock_us",
  CRYPTO_SPOT: "crypto",
  CRYPTO_FUTURES: "crypto",
  MULTI_ASSET: "multi_asset",
};

// Shorter than the labels in market-colors.ts — these have to fit a table cell.
const MARKET_LABELS: Record<string, string> = {
  FOREX: "Forex",
  COMMODITY: "Komoditas",
  STOCK_IDX: "Saham IDX",
  STOCK_US: "Saham US",
  CRYPTO_SPOT: "Crypto",
  CRYPTO_FUTURES: "Crypto Fut",
  MULTI_ASSET: "Multi Asset",
};

interface PropertyPillProps {
  variant?: PillVariant;
  marketType?: string;
  label?: string;
  className?: string;
}

export function PropertyPill({ variant, marketType, label, className }: PropertyPillProps) {
  const resolvedVariant =
    variant ?? (marketType ? MARKET_TO_VARIANT[marketType] : "neutral") ?? "neutral";
  const resolvedLabel = label ?? (marketType ? MARKET_LABELS[marketType] : "–");

  const base =
    "inline-flex items-center rounded-sm px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap";

  const tokenClass = TOKEN_CLASSES[resolvedVariant];
  if (tokenClass) {
    return <span className={cn(base, tokenClass, className)}>{resolvedLabel}</span>;
  }

  // Tint = the hue at 14% over the surface. Ink = the hue pulled 25% toward the
  // current foreground, which darkens it on the light theme and lightens it on
  // the dark one — one formula, adequate contrast in both.
  const hue = VARIANT_HUE[resolvedVariant] ?? "#848E9C";
  return (
    <span
      style={{ "--pill": hue } as React.CSSProperties}
      className={cn(
        base,
        "bg-[color-mix(in_oklch,var(--pill),transparent_86%)]",
        "text-[color-mix(in_oklch,var(--pill),var(--foreground)_25%)]",
        className
      )}
    >
      {resolvedLabel}
    </span>
  );
}

export { MARKET_TO_VARIANT, MARKET_LABELS };
