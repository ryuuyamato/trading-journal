"use client";

import type { LotPlan } from "@/lib/lot-calculator";
import { cn } from "@/lib/utils";

export function PlanStats({
  plan,
  balanceUsd,
  isLadder,
  tp1Pip,
  tpNPip,
  fmt,
}: {
  plan: LotPlan;
  balanceUsd: number;
  isLadder: boolean;
  tp1Pip: number;
  tpNPip: number;
  fmt: {
    money: (usd: number) => string;
    pips: (p: number) => string;
    /** Secondary line: USD equivalent for cent accounts, plus IDR. */
    secondary: (usd: number) => string;
  };
}) {
  const { rr } = plan;
  const riskShare = rr > 0 ? 100 / (1 + rr) : 50;
  const pct = (usd: number) => (balanceUsd ? ((usd / balanceUsd) * 100).toFixed(2) + "%" : "—");

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border">
      <Stat
        label="Total pip SL"
        value={`${fmt.pips(plan.effectivePipsToStop)} pip`}
        tone="loss"
        sub={
          plan.legs.length > 1
            ? `dari P1: ${fmt.pips(plan.pipsToStopFromFirst)} pip`
            : undefined
        }
      />
      <Stat
        label="Total pip TP"
        value={`${fmt.pips(plan.effectivePipsToTarget)} pip`}
        tone="profit"
        sub={
          isLadder
            ? `TP1 ${fmt.pips(tp1Pip)} → TP${plan.legs.length} ${fmt.pips(tpNPip)} pip · rata tertimbang ${fmt.pips(plan.avgPipsToTarget)} pip`
            : undefined
        }
      />
      <Stat
        label="Risiko maksimum di SL"
        value={`−${fmt.money(plan.full.lossUsd)}`}
        tone="loss"
        sub={`${fmt.secondary(plan.full.lossUsd)} · budget ${fmt.money(plan.riskBudgetUsd)}`}
      />
      <Stat
        label="Profit kalau semua TP kena"
        value={`+${fmt.money(plan.full.profitUsd)}`}
        tone="profit"
        sub={fmt.secondary(plan.full.profitUsd)}
      />
      <Stat
        label="Saldo setelah SL"
        value={fmt.money(balanceUsd - plan.full.lossUsd)}
        tone="loss"
        sub={balanceUsd ? `−${pct(plan.full.lossUsd)}` : undefined}
      />
      <Stat
        label="Saldo setelah semua TP"
        value={fmt.money(balanceUsd + plan.full.profitUsd)}
        tone="profit"
        sub={balanceUsd ? `+${pct(plan.full.profitUsd)}` : undefined}
      />

      <div className="col-span-2 bg-card px-3.5 py-3">
        <p className="text-[10px] tracking-[0.13em] text-muted-foreground uppercase">
          {plan.legs.length > 1
            ? "Risk : Reward efektif — skenario semua layer terisi"
            : "Risk : Reward efektif"}
        </p>
        <p className="num mt-1 text-[17px] font-semibold text-primary">
          {rr > 0 ? `1 : ${rr.toFixed(2)}` : "—"}
        </p>
        {/* Reward vs risk as literal widths — a 1:3 setup should look like one. */}
        <div className="mt-2 flex h-2 gap-0.5">
          <span className="block bg-loss" style={{ width: `${riskShare}%` }} />
          <span className="block bg-profit" style={{ width: `${100 - riskShare}%` }} />
        </div>
        {rr > 0 && (
          <p className="num mt-2 text-[10.5px] text-muted-foreground">
            Win rate minimum untuk impas: {plan.breakEvenWinRate.toFixed(1)}% · RR nominal ke TP
            terjauh: 1 : {plan.nominalRr.toFixed(2)}
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "profit" | "loss";
}) {
  return (
    <div className="bg-card px-3.5 py-3">
      <p className="text-[10px] tracking-[0.13em] text-muted-foreground uppercase">{label}</p>
      <p
        className={cn(
          "num mt-1 text-[16px] font-semibold",
          tone === "profit" ? "text-profit" : tone === "loss" ? "text-loss" : "text-foreground"
        )}
      >
        {value}
      </p>
      {sub && <p className="num mt-1 text-[10.5px] leading-relaxed text-muted-foreground">{sub}</p>}
    </div>
  );
}
