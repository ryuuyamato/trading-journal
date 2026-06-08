import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PropertyPill } from "@/components/ui/property-pill";
import { AccountDetailActions } from "@/components/accounts/account-detail-actions";
import { AccountTransactionActions } from "@/components/accounts/account-transaction-actions";
import { AccountTransactionList, type AccountTransactionItem } from "@/components/accounts/account-transaction-list";
import { TradesTable } from "@/components/trades/views/trades-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { EquityCurve } from "@/components/dashboard/equity-curve";
import { CalendarHeatmap } from "@/components/dashboard/calendar-heatmap";
import { getDashboardStats, getCalendarHeatmap } from "@/lib/dashboard";
import { formatCentWithUsd } from "@/lib/utils";
import type { TradeListItem, AccountOption } from "@/components/trades/types";
import type { AccountFormValues } from "@/components/accounts/account-form-dialog";

function formatBalance(currency: string, balance: number) {
  if (currency === "USC") return formatCentWithUsd(balance, "");
  if (currency === "IDR") return `Rp ${balance.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;
  return `${currency} ${balance.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session!.user!.id!;
  const { id } = await params;

  const account = await prisma.tradingAccount.findFirst({
    where: { id, userId },
    include: { _count: { select: { trades: true } } },
  });
  if (!account) notFound();

  const [trades, stats, heatmap, transactions] = await Promise.all([
    prisma.trade.findMany({
      where: { accountId: account.id },
      include: {
        account: { select: { name: true, marketType: true, currency: true } },
        tags: { include: { tag: true } },
        screenshots: true,
      },
      orderBy: { openTime: "desc" },
      take: 100,
    }),
    getDashboardStats(userId, account.id),
    getCalendarHeatmap(userId, account.id),
    prisma.accountTransaction.findMany({
      where: { accountId: account.id },
      orderBy: { occurredAt: "desc" },
    }),
  ]);

  const transactionItems: AccountTransactionItem[] = transactions.map((tx) => ({
    id: tx.id,
    type: tx.type,
    amount: tx.amount,
    note: tx.note,
    occurredAt: tx.occurredAt.toISOString(),
  }));

  const items: TradeListItem[] = trades.map((trade) => ({
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
    account: trade.account,
    tags: trade.tags.map(({ tag }) => ({ id: tag.id, name: tag.name, color: tag.color })),
    screenshots: trade.screenshots.map((s) => ({ id: s.id, url: s.url, caption: s.caption })),
  }));

  const accountOptions: AccountOption[] = [
    { id: account.id, name: account.name, marketType: account.marketType, currency: account.currency },
  ];

  const formValues: AccountFormValues = {
    id: account.id,
    name: account.name,
    broker: account.broker,
    marketType: account.marketType,
    currency: account.currency,
    balance: account.balance,
    description: account.description,
  };

  const profitTrend =
    stats.totalNetProfit > 0 ? "positive" : stats.totalNetProfit < 0 ? "negative" : "neutral";

  const pnlSign = stats.totalNetProfit >= 0 ? "+" : "-";
  const pnlAbs = Math.abs(stats.totalNetProfit);
  const netPnlStr =
    account.currency === "USC"
      ? formatCentWithUsd(pnlAbs, pnlSign)
      : account.currency === "IDR"
      ? `${pnlSign}Rp ${pnlAbs.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`
      : `${pnlSign}$${pnlAbs.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <Link
          href="/accounts"
          className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Akun
        </Link>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-[20px] font-medium">{account.name}</h1>
            <PropertyPill marketType={account.marketType} />
            {!account.isActive && <PropertyPill variant="neutral" label="Nonaktif" />}
          </div>
          <p className="text-[12px] text-muted-foreground">
            {account.broker ? `${account.broker} · ` : ""}
            Modal {formatBalance(account.currency, account.balance)}
            {account.description ? ` · ${account.description}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AccountTransactionActions accountId={account.id} />
          <AccountDetailActions account={formValues} tradeCount={account._count.trades} />
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <StatCard
          label="Win rate"
          value={`${stats.winRate.toFixed(0)}%`}
          trend={stats.totalTrades > 0 ? (stats.winRate >= 50 ? "positive" : "negative") : "neutral"}
        />
        <StatCard
          label="Profit factor"
          value={stats.profitFactor.toFixed(2)}
          trend={stats.totalTrades > 0 ? (stats.profitFactor >= 1 ? "positive" : "negative") : "neutral"}
        />
        <StatCard
          label="Net P&L"
          value={stats.totalTrades > 0 ? netPnlStr : "–"}
          trend={stats.totalTrades > 0 ? profitTrend : "neutral"}
        />
        <StatCard
          label="Trade"
          value={stats.totalTrades.toString()}
          subValue="trade tertutup"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <EquityCurve data={stats.equityCurve} />
        <CalendarHeatmap data={heatmap} />
      </div>

      {/* Deposit / withdraw history */}
      <div className="space-y-2">
        <h2 className="text-[14px] font-medium">Riwayat Deposit &amp; Withdraw</h2>
        <AccountTransactionList accountId={account.id} currency={account.currency} transactions={transactionItems} />
      </div>

      {/* Trade history */}
      <div className="space-y-2">
        <h2 className="text-[14px] font-medium">Riwayat Trading</h2>
        {items.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-muted-foreground border border-border rounded-xl">
            Belum ada trade pada akun ini.
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <TradesTable trades={items} accounts={accountOptions} />
          </div>
        )}
      </div>
    </div>
  );
}
