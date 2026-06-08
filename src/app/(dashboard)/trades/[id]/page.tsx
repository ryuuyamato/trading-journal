import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PropertyPill } from "@/components/ui/property-pill";
import { TradeDetailActions } from "@/components/trades/trade-detail-actions";
import { TradeScreenshots } from "@/components/trades/trade-screenshots";
import { formatCentWithUsd } from "@/lib/utils";
import type { TradeFormValues } from "@/components/trades/trade-form-dialog";

function formatDateTime(d: Date | null) {
  if (!d) return "–";
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });
}

function formatPnl(v: number | null, currency = "USD") {
  if (v === null) return "–";
  const prefix = v >= 0 ? "+" : "-";
  if (currency === "IDR") {
    return `${prefix}Rp ${Math.abs(v).toLocaleString("id-ID")}`;
  }
  if (currency === "USC") return formatCentWithUsd(Math.abs(v), prefix);
  return `${prefix}$${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatNum(v: number | null, suffix = "") {
  return v === null || v === undefined ? "–" : `${v}${suffix}`;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-[13px] font-medium mt-0.5">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-4 space-y-3">
      <h2 className="text-[13px] font-medium">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{children}</div>
    </div>
  );
}

export default async function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session!.user!.id!;
  const { id } = await params;

  const [trade, accounts] = await Promise.all([
    prisma.trade.findFirst({
      where: { id, account: { userId } },
      include: {
        account: { select: { id: true, name: true, marketType: true, currency: true } },
        tags: { include: { tag: true } },
        screenshots: true,
      },
    }),
    prisma.tradingAccount.findMany({
      where: { userId, isActive: true },
      select: { id: true, name: true, marketType: true, currency: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!trade) notFound();

  const marketType =
    trade.account.marketType === "MULTI_ASSET" && trade.tradeMarketType
      ? trade.tradeMarketType
      : trade.account.marketType;

  const isForexOrCommodity = marketType === "FOREX" || marketType === "COMMODITY";
  const isStock = marketType === "STOCK_IDX" || marketType === "STOCK_US";
  const isCryptoFutures = marketType === "CRYPTO_FUTURES";

  const profit = trade.netProfit ?? null;
  const isProfit = profit !== null && profit > 0;
  const isLoss = profit !== null && profit < 0;

  const formValues: TradeFormValues = {
    id: trade.id,
    accountId: trade.accountId,
    symbol: trade.symbol,
    direction: trade.direction,
    status: trade.status,
    entryMode: trade.entryMode,
    openTime: trade.openTime.toISOString(),
    closeTime: trade.closeTime ? trade.closeTime.toISOString() : null,
    openPrice: trade.openPrice,
    closePrice: trade.closePrice,
    lotSize: trade.lotSize,
    swap: trade.swap,
    priceRangeHigh: trade.priceRangeHigh,
    priceRangeLow: trade.priceRangeLow,
    layerCount: trade.layerCount,
    quantity: trade.quantity,
    buyFee: trade.buyFee,
    sellFee: trade.sellFee,
    taxAmount: trade.taxAmount,
    dividend: trade.dividend,
    leverage: trade.leverage,
    marginMode: trade.marginMode,
    fundingRate: trade.fundingRate,
    grossProfit: trade.grossProfit,
    commission: trade.commission,
    netProfit: trade.netProfit,
    rMultiple: trade.rMultiple,
    pips: trade.pips,
    stopLoss: trade.stopLoss,
    takeProfit: trade.takeProfit,
    riskPercent: trade.riskPercent,
    tradeMarketType: trade.tradeMarketType,
    setup: trade.setup,
    notes: trade.notes,
    tagIds: trade.tags.map((t) => t.tagId),
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <Link
          href="/trades"
          className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Jurnal
        </Link>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-[20px] font-medium">{trade.symbol}</h1>
            <PropertyPill
              variant={trade.direction === "LONG" ? "profit" : "loss"}
              label={trade.direction === "LONG" ? "Long / Buy" : "Short / Sell"}
            />
            <PropertyPill marketType={marketType ?? undefined} />
            {trade.status === "OPEN" && <PropertyPill variant="neutral" label="Open" />}
          </div>
          <p className="text-[12px] text-muted-foreground">
            {trade.account.name} · dibuka {formatDateTime(trade.openTime)}
          </p>
        </div>
        <TradeDetailActions trade={formValues} accounts={accounts} />
      </div>

      {/* Result summary */}
      <div className="rounded-xl border border-border p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Field
          label="Hasil"
          value={
            trade.status === "OPEN" ? (
              <PropertyPill variant="neutral" label="Open" />
            ) : profit === null ? (
              "–"
            ) : (
              <PropertyPill variant={isProfit ? "profit" : isLoss ? "loss" : "neutral"} label={isProfit ? "Profit" : isLoss ? "Loss" : "BE"} />
            )
          }
        />
        <Field
          label="Net Profit"
          value={
            <span style={{ color: isProfit ? "var(--color-profit)" : isLoss ? "var(--color-loss)" : undefined }}>
              {formatPnl(profit, trade.account.currency)}
            </span>
          }
        />
        <Field label="R-Multiple" value={trade.rMultiple !== null ? `${trade.rMultiple > 0 ? "+" : ""}${trade.rMultiple}` : "–"} />
        <Field label="Gross Profit" value={formatPnl(trade.grossProfit, trade.account.currency)} />
      </div>

      <Section title="Waktu &amp; Harga">
        <Field label="Waktu Buka" value={formatDateTime(trade.openTime)} />
        <Field label="Waktu Tutup" value={formatDateTime(trade.closeTime)} />
        <Field label="Mode Entry" value={trade.entryMode === "MULTI_LAYER" ? `Multi-Layer · ${trade.layerCount ?? "?"} layer` : "Single Entry"} />
        <Field label="Harga Buka" value={trade.openPrice} />
        <Field label="Harga Tutup" value={formatNum(trade.closePrice)} />
        {trade.entryMode === "MULTI_LAYER" && (
          <Field label="Rentang Harga" value={`${formatNum(trade.priceRangeLow)} – ${formatNum(trade.priceRangeHigh)}`} />
        )}
      </Section>

      <Section title="Manajemen Risiko">
        <Field label="Stop Loss" value={formatNum(trade.stopLoss)} />
        <Field label="Take Profit" value={formatNum(trade.takeProfit)} />
        <Field label="Risk %" value={formatNum(trade.riskPercent, "%")} />
      </Section>

      {isForexOrCommodity && (
        <Section title="Detail Forex / Komoditas">
          <Field label="Lot Size" value={formatNum(trade.lotSize)} />
          <Field label="Swap" value={formatNum(trade.swap)} />
          <Field label="Pips" value={formatNum(trade.pips)} />
        </Section>
      )}

      {isStock && (
        <Section title="Detail Saham">
          <Field label="Jumlah" value={formatNum(trade.quantity)} />
          <Field label="Biaya Beli" value={formatNum(trade.buyFee)} />
          <Field label="Biaya Jual" value={formatNum(trade.sellFee)} />
          <Field label="Pajak" value={formatNum(trade.taxAmount)} />
          <Field label="Dividen" value={formatNum(trade.dividend)} />
        </Section>
      )}

      {isCryptoFutures && (
        <Section title="Detail Crypto Futures">
          <Field label="Leverage" value={formatNum(trade.leverage, "x")} />
          <Field label="Margin Mode" value={trade.marginMode ?? "–"} />
          <Field label="Funding Rate" value={formatNum(trade.fundingRate)} />
        </Section>
      )}

      <Section title="P&amp;L &amp; Biaya">
        <Field label="Gross Profit" value={formatPnl(trade.grossProfit, trade.account.currency)} />
        <Field label="Komisi" value={formatNum(trade.commission)} />
        <Field label="Net Profit" value={formatPnl(trade.netProfit, trade.account.currency)} />
      </Section>

      {trade.tags.length > 0 && (
        <div className="rounded-xl border border-border p-4 space-y-2">
          <h2 className="text-[13px] font-medium">Tag</h2>
          <div className="flex flex-wrap gap-1.5">
            {trade.tags.map(({ tag }) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[11px] font-medium"
                style={{ backgroundColor: `${tag.color}22`, color: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {(trade.setup || trade.notes) && (
        <div className="rounded-xl border border-border p-4 space-y-3">
          <h2 className="text-[13px] font-medium">Analisis</h2>
          {trade.setup && (
            <div>
              <p className="text-[11px] text-muted-foreground">Setup / Strategi</p>
              <p className="text-[13px] mt-0.5">{trade.setup}</p>
            </div>
          )}
          {trade.notes && (
            <div>
              <p className="text-[11px] text-muted-foreground">Catatan</p>
              <p className="text-[13px] mt-0.5 whitespace-pre-wrap">{trade.notes}</p>
            </div>
          )}
        </div>
      )}

      <TradeScreenshots tradeId={trade.id} screenshots={trade.screenshots} />
    </div>
  );
}
