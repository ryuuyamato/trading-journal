import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TradesView } from "@/components/trades/trades-view";
import type { TradeListItem } from "@/components/trades/types";

export default async function TradesPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [accounts, trades] = await Promise.all([
    prisma.tradingAccount.findMany({
      where: { userId, isActive: true },
      select: { id: true, name: true, marketType: true, currency: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.trade.findMany({
      where: { account: { userId } },
      include: {
        account: { select: { name: true, marketType: true, currency: true } },
        tags: { include: { tag: true } },
        screenshots: true,
      },
      orderBy: { openTime: "desc" },
      take: 100,
    }),
  ]);

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

  return (
    <div className="max-w-5xl space-y-0">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[20px] font-medium">Jurnal</h1>
      </div>

      <TradesView accounts={accounts} trades={items} />
    </div>
  );
}
