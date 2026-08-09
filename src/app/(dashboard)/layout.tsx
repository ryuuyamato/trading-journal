import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAccountNetProfitMap, getTodayNetProfit } from "@/lib/dashboard";
import { AppRail } from "@/components/layout/app-rail";
import { AppTopBar } from "@/components/layout/app-topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id!;

  const accounts = await prisma.tradingAccount.findMany({
    where: { userId, isActive: true },
    select: { id: true, name: true, marketType: true, currency: true, balance: true },
    orderBy: { createdAt: "asc" },
  });

  const [pnlByAccount, today] = await Promise.all([
    getAccountNetProfitMap(accounts.map((a) => a.id)),
    getTodayNetProfit(userId),
  ]);

  // Same definition the dashboard uses: deposited capital plus realised P&L.
  const topBarAccounts = accounts.map((acc) => ({
    id: acc.id,
    name: acc.name,
    marketType: acc.marketType,
    currency: acc.currency,
    totalBalance: acc.balance + (pnlByAccount.get(acc.id) ?? 0),
  }));

  return (
    <div className="min-h-screen bg-background">
      <AppTopBar
        userName={session.user.name}
        userEmail={session.user.email}
        accounts={topBarAccounts}
        todayNetProfit={today.netProfit}
        todayTradeCount={today.tradeCount}
      />
      <AppRail isAdmin={session.user.role === "ADMIN"} />

      {/* Offsets: 48px top bar always; 56px rail on desktop, 56px tab bar at
          the bottom on mobile. */}
      <main className="pt-12 md:pl-14">
        <div className="px-4 pt-4 pb-20 md:px-6 md:py-6">{children}</div>
      </main>
    </div>
  );
}
