import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAccountNetProfitMap, getTodayNetProfit } from "@/lib/dashboard";
import { AppRail } from "@/components/layout/app-rail";
import { AppTopBar } from "@/components/layout/app-topbar";
import { MobileTopBar } from "@/components/layout/mobile-topbar";
import { MobileTabBar } from "@/components/layout/mobile-tabbar";

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

  const isAdmin = session.user.role === "ADMIN";

  // Two shells, switched by CSS rather than by a JS media query: the phone
  // chrome and the desktop chrome each render only at their own breakpoint, so
  // there is no first-paint flash and no hydration mismatch.
  return (
    <div className="min-h-screen bg-background">
      <MobileTopBar />
      <AppTopBar
        userName={session.user.name}
        userEmail={session.user.email}
        accounts={topBarAccounts}
        todayNetProfit={today.netProfit}
        todayTradeCount={today.tradeCount}
      />
      <AppRail isAdmin={isAdmin} />
      <MobileTabBar
        accounts={topBarAccounts}
        isAdmin={isAdmin}
        userName={session.user.name}
        userEmail={session.user.email}
      />

      {/* Offsets: 52px phone header / 48px desktop bar at the top; 56px rail on
          the left at md+, and room for the tab bar plus its safe-area inset at
          the bottom on phones. */}
      <main className="pt-[calc(3.25rem+env(safe-area-inset-top))] md:pt-12 md:pl-14">
        <div className="px-4 pt-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:px-6 md:py-6 md:pb-6">
          {children}
        </div>
      </main>
    </div>
  );
}
