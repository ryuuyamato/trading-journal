import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateAccountDialog } from "@/components/accounts/create-account-dialog";
import { PropertyPill } from "@/components/ui/property-pill";
import { formatCentWithUsd } from "@/lib/utils";

const MARKET_DOT_COLORS: Record<string, string> = {
  FOREX: "#378ADD",
  COMMODITY: "#EF9F27",
  STOCK_IDX: "#1D9E75",
  STOCK_US: "#085041",
  CRYPTO_SPOT: "#7F77DD",
  CRYPTO_FUTURES: "#7F77DD",
  MULTI_ASSET: "#C47B2B",
};

export default async function AccountsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const accounts = await prisma.tradingAccount.findMany({
    where: { userId },
    include: { _count: { select: { trades: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-medium">Akun</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">Kelola akun trading Anda</p>
        </div>
        <CreateAccountDialog />
      </div>

      {accounts.length === 0 ? (
        <div className="py-16 text-center text-[13px] text-muted-foreground border border-border rounded-xl">
          Belum ada akun. Klik &ldquo;Akun Baru&rdquo; untuk membuat akun pertama.
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-120">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left py-2 px-4 text-[11px] text-muted-foreground font-medium">Nama</th>
                <th className="text-left py-2 px-4 text-[11px] text-muted-foreground font-medium">Market</th>
                <th className="text-left py-2 px-4 text-[11px] text-muted-foreground font-medium">Broker</th>
                <th className="text-right py-2 px-4 text-[11px] text-muted-foreground font-medium">Modal</th>
                <th className="text-right py-2 px-4 text-[11px] text-muted-foreground font-medium">Trade</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => (
                <tr key={acc.id} className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors">
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: MARKET_DOT_COLORS[acc.marketType] ?? "#9b9a97" }}
                      />
                      <span className="text-[13px] font-medium">{acc.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    <PropertyPill marketType={acc.marketType} />
                  </td>
                  <td className="py-2.5 px-4 text-[13px] text-muted-foreground">
                    {acc.broker ?? "–"}
                  </td>
                  <td className="py-2.5 px-4 text-right text-[13px]">
                    {acc.currency === "USC"
                      ? formatCentWithUsd(acc.balance, "")
                      : `${acc.currency} ${acc.balance.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`}
                  </td>
                  <td className="py-2.5 px-4 text-right text-[13px] text-muted-foreground">
                    {acc._count.trades}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
