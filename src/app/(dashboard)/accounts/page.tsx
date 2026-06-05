import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateAccountDialog } from "@/components/accounts/create-account-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet } from "lucide-react";

const MARKET_LABELS: Record<string, string> = {
  FOREX: "Forex",
  COMMODITY: "Komoditas",
  STOCK_IDX: "Saham IDX",
  STOCK_US: "Saham US",
  CRYPTO_SPOT: "Crypto Spot",
  CRYPTO_FUTURES: "Crypto Futures",
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Akun Trading</h1>
          <p className="text-muted-foreground text-sm">Kelola akun trading Anda</p>
        </div>
        <CreateAccountDialog />
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
            <Wallet className="h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium">Belum ada akun trading</p>
            <p className="text-sm text-muted-foreground">
              Buat akun pertama Anda untuk mulai mencatat trade
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <Card key={account.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <Wallet className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{account.name}</p>
                      {account.broker && (
                        <p className="text-xs text-muted-foreground">{account.broker}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {MARKET_LABELS[account.marketType] ?? account.marketType}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Modal</p>
                    <p className="text-sm font-medium">
                      {account.currency}{" "}
                      {account.balance.toLocaleString("id-ID", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Trade</p>
                    <p className="text-sm font-medium">{account._count.trades}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
