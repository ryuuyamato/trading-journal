import { cn } from "@/lib/utils";

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

const PILL_STYLES: Record<PillVariant, { bg: string; text: string }> = {
  forex:     { bg: "#E6F1FB", text: "#0C447C" },
  commodity: { bg: "#FAEEDA", text: "#633806" },
  crypto:    { bg: "#EEEDFE", text: "#3C3489" },
  stock:     { bg: "#E1F5EE", text: "#085041" },
  stock_us:  { bg: "#E1F5EE", text: "#085041" },
  multi_asset: { bg: "#FEF3E2", text: "#7C4A00" },
  mode:      { bg: "#F1EFE8", text: "#444441" },
  profit:    { bg: "#E1F5EE", text: "#0F6E56" },
  loss:      { bg: "#FCEBEB", text: "#A32D2D" },
  neutral:   { bg: "#F1EFE8", text: "#444441" },
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
  const resolvedVariant = variant ?? (marketType ? MARKET_TO_VARIANT[marketType] : "neutral") ?? "neutral";
  const resolvedLabel = label ?? (marketType ? MARKET_LABELS[marketType] : "–");
  const { bg, text } = PILL_STYLES[resolvedVariant];

  return (
    <span
      className={cn("inline-flex items-center px-2 py-0.5 rounded-[6px] text-[11px] font-medium whitespace-nowrap", className)}
      style={{ backgroundColor: bg, color: text }}
    >
      {resolvedLabel}
    </span>
  );
}

export { MARKET_TO_VARIANT, MARKET_LABELS };
