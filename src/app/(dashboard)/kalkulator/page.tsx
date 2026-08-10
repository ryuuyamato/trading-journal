import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccountNetProfitMap } from "@/lib/dashboard";
import { getExchangeRates } from "@/lib/exchange-rates";
import { LotCalculator } from "@/components/calculator/lot-calculator";

export const metadata: Metadata = {
  title: "Kalkulator Lot & Risiko — Kandel",
};

export default async function CalculatorPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const accounts = await prisma.tradingAccount.findMany({
    where: { userId, isActive: true },
    select: { id: true, name: true, currency: true, marketType: true, balance: true },
    orderBy: { createdAt: "asc" },
  });

  const [profitMap, rates] = await Promise.all([
    getAccountNetProfitMap(accounts.map((a) => a.id)),
    getExchangeRates(),
  ]);

  // Same balance definition the dashboard and top bar use: deposited capital
  // plus realised P&L, so the risk budget is sized off real equity.
  const calcAccounts = accounts.map((acc) => ({
    id: acc.id,
    name: acc.name,
    currency: acc.currency,
    marketType: acc.marketType,
    totalBalance: acc.balance + (profitMap.get(acc.id) ?? 0),
  }));

  return (
    <LotCalculator
      accounts={calcAccounts}
      usdToIdr={rates?.usdToIdr ?? null}
      ratesDate={rates?.date ?? null}
    />
  );
}
