import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountFormDialog } from "@/components/accounts/account-form-dialog";
import { AccountRowActions } from "@/components/accounts/account-row-actions";
import { AccountRow } from "@/components/accounts/account-row";
import { PropertyPill } from "@/components/ui/property-pill";
import { cn, formatCentWithUsd } from "@/lib/utils";
import { getAccountNetProfitMap } from "@/lib/dashboard";
import { marketDotColor } from "@/lib/market-colors";

function formatAmount(currency: string, amount: number) {
  return currency === "USC"
    ? formatCentWithUsd(amount, "")
    : `${currency} ${amount.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;
}

export default async function AccountsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const accounts = await prisma.tradingAccount.findMany({
    where: { userId },
    include: { _count: { select: { trades: true } } },
    orderBy: { createdAt: "desc" },
  });

  const profitMap = await getAccountNetProfitMap(accounts.map((a) => a.id));

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-semibold tracking-tight">Akun</h1>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">Kelola akun trading Anda</p>
        </div>
        <AccountFormDialog mode="create" />
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-[13px] text-muted-foreground">
          Belum ada akun. Klik &ldquo;Akun Baru&rdquo; untuk membuat akun pertama.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
          <table className="w-full min-w-120 border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-2 text-left text-[10.5px] font-medium tracking-wider text-muted-foreground uppercase">Nama</th>
                <th className="px-4 py-2 text-left text-[10.5px] font-medium tracking-wider text-muted-foreground uppercase">Market</th>
                <th className="px-4 py-2 text-left text-[10.5px] font-medium tracking-wider text-muted-foreground uppercase">Broker</th>
                <th className="px-4 py-2 text-right text-[10.5px] font-medium tracking-wider text-muted-foreground uppercase">Modal</th>
                <th className="px-4 py-2 text-right text-[10.5px] font-medium tracking-wider text-muted-foreground uppercase">Balance</th>
                <th className="px-4 py-2 text-right text-[10.5px] font-medium tracking-wider text-muted-foreground uppercase">Trade</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => (
                <AccountRow
                  key={acc.id}
                  accountId={acc.id}
                  actions={
                    <AccountRowActions
                      account={{
                        id: acc.id,
                        name: acc.name,
                        broker: acc.broker,
                        marketType: acc.marketType,
                        currency: acc.currency,
                        balance: acc.balance,
                        description: acc.description,
                      }}
                      tradeCount={acc._count.trades}
                    />
                  }
                >
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: marketDotColor(acc.marketType) }}
                      />
                      <span className="text-[13px] font-medium">{acc.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <PropertyPill marketType={acc.marketType} />
                  </td>
                  <td className="px-4 py-2 text-[13px] text-muted-foreground">
                    {acc.broker ?? "–"}
                  </td>
                  <td className="num px-4 py-2 text-right text-[13px] text-muted-foreground">
                    {acc.currency === "USC"
                      ? formatCentWithUsd(acc.balance, "")
                      : `${acc.currency} ${acc.balance.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {(() => {
                      const netProfit = profitMap.get(acc.id) ?? 0;
                      return (
                        <span
                          className={cn(
                            "num text-[13px] font-semibold",
                            netProfit > 0
                              ? "text-profit"
                              : netProfit < 0
                              ? "text-loss"
                              : "text-foreground"
                          )}
                        >
                          {formatAmount(acc.currency, acc.balance + netProfit)}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="num px-4 py-2 text-right text-[13px] text-muted-foreground">
                    {acc._count.trades}
                  </td>
                </AccountRow>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
