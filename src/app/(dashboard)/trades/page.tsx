import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewTradeDialog } from "@/components/trades/new-trade-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

const DIRECTION_LABELS: Record<string, string> = { LONG: "Long", SHORT: "Short" };
const STATUS_LABELS: Record<string, string> = { OPEN: "Open", CLOSED: "Closed" };

export default async function TradesPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [accounts, tradesData] = await Promise.all([
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
      },
      orderBy: { openTime: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trades</h1>
          <p className="text-muted-foreground text-sm">Riwayat dan catatan trade Anda</p>
        </div>
        <NewTradeDialog accounts={accounts} />
      </div>

      {tradesData.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
            <BarChart2 className="h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium">Belum ada trade</p>
            <p className="text-sm text-muted-foreground">
              Klik &ldquo;Trade Baru&rdquo; untuk mulai mencatat
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Symbol</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Akun</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Arah</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Open</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Close</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Net P&L</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">R</th>
                </tr>
              </thead>
              <tbody>
                {tradesData.map((trade) => {
                  const profit = trade.netProfit ?? null;
                  const isProfit = profit !== null && profit > 0;
                  const isLoss = profit !== null && profit < 0;
                  return (
                    <tr key={trade.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{trade.symbol}</td>
                      <td className="px-4 py-3 text-muted-foreground">{trade.account.name}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            trade.direction === "LONG"
                              ? "border-[var(--color-profit)] text-[var(--color-profit)]"
                              : "border-[var(--color-loss)] text-[var(--color-loss)]"
                          )}
                        >
                          {DIRECTION_LABELS[trade.direction]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={trade.status === "OPEN" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {STATUS_LABELS[trade.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {trade.openPrice.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {trade.closePrice?.toLocaleString() ?? "–"}
                      </td>
                      <td className={cn(
                        "px-4 py-3 text-right font-medium",
                        isProfit && "text-[var(--color-profit)]",
                        isLoss && "text-[var(--color-loss)]"
                      )}>
                        {profit !== null
                          ? (profit >= 0 ? "+" : "") + profit.toLocaleString("id-ID", { minimumFractionDigits: 2 })
                          : "–"}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {trade.rMultiple !== null ? `${trade.rMultiple}R` : "–"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
