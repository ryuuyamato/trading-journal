"use client";

import type { LotPlan } from "@/lib/lot-calculator";
import { cn } from "@/lib/utils";
import { SectionLabel } from "@/components/calculator/chips";

interface Fmt {
  price: (p: number) => string;
  money: (usd: number) => string;
  lot: (lot: number) => string;
  pips: (p: number) => string;
}

const TH =
  "px-2 py-2 text-right text-[9.5px] font-normal tracking-[0.11em] text-muted-foreground uppercase first:text-left";
const TD = "px-2 py-2 text-right first:text-left";

// Wide tables scroll inside their own box rather than pushing the page sideways.
function Scroller({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <table className="num w-full min-w-140 border-collapse text-[12px]">{children}</table>
    </div>
  );
}

export function PlanTables({
  plan,
  fmt,
  singlePrice,
  splitMode,
  shiftToBreakEven,
}: {
  plan: LotPlan;
  fmt: Fmt;
  singlePrice: boolean;
  splitMode: boolean;
  shiftToBreakEven: boolean;
}) {
  const { legs, isLadder, isStagedBreakEven } = plan;

  return (
    <div className="space-y-6">
      {/* ── Legs ─────────────────────────────────────────────────────── */}
      <section>
        <SectionLabel className="mb-3">
          {splitMode ? "Rincian order" : "Rincian posisi"}
        </SectionLabel>
        <Scroller>
          <thead>
            <tr className="border-b border-border">
              <th className={TH}>{splitMode ? "Order" : "Posisi"}</th>
              <th className={TH}>Harga entry</th>
              <th className={TH}>Lot posisi ini</th>
              <th className={TH}>Target exit</th>
              <th className={TH}>Pip ke SL</th>
              <th className={TH}>Rugi di SL</th>
            </tr>
          </thead>
          <tbody>
            {legs.map((leg) => (
              <tr
                key={leg.index}
                className={cn("border-b border-border/60", leg.isRunner && "bg-primary/[0.06]")}
              >
                <td className={cn(TD, "text-primary")}>P{leg.index + 1}</td>
                <td className={TD}>{fmt.price(leg.price)}</td>
                <td className={TD}>{fmt.lot(leg.lot)}</td>
                <td className={cn(TD, leg.isRunner ? "text-profit" : "text-muted-foreground")}>
                  {isStagedBreakEven && !leg.isRunner
                    ? `BE ${fmt.price(leg.target)}`
                    : `${isLadder ? "TP " : "TP "}${fmt.price(leg.target)}`}
                </td>
                <td className={TD}>{fmt.pips(leg.pipsToStop)}</td>
                <td className={cn(TD, "text-loss")}>{fmt.money(leg.lossUsd)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border font-semibold text-primary">
              <td className={TD}>Total</td>
              <td className={TD}>
                {singlePrice ? fmt.price(legs[0].price) : `avg ${fmt.price(plan.avgEntry)}`}
              </td>
              <td className={TD}>{fmt.lot(plan.totalLot)}</td>
              <td className={TD}>—</td>
              <td className={TD}>{fmt.pips(plan.effectivePipsToStop)}</td>
              <td className={TD}>{fmt.money(plan.full.lossUsd)}</td>
            </tr>
          </tfoot>
        </Scroller>
        <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">
          {splitMode
            ? `Semua ${legs.length} order dibuka di harga ${fmt.price(legs[0].price)} dengan SL identik di ${fmt.price(plan.stopLoss)}. Yang berbeda hanya TP-nya.`
            : singlePrice
            ? ""
            : `Kolom lot di tabel ini per posisi, bukan kumulatif. Total order = ${fmt.lot(plan.totalLot)} lot.`}
        </p>
      </section>

      {/* ── Ladder ───────────────────────────────────────────────────── */}
      {isLadder && (
        <section>
          <SectionLabel className="mb-3">Panen bertingkat</SectionLabel>
          <Scroller>
            <thead>
              <tr className="border-b border-border">
                <th className={TH}>Level</th>
                <th className={TH}>Harga</th>
                <th className={TH}>Posisi close</th>
                <th className={TH}>Lot close</th>
                <th className={TH}>Profit level</th>
                <th className={TH}>Kumulatif</th>
                <th className={TH}>Sisa lot</th>
                <th className={TH}>Kalau balik arah</th>
              </tr>
            </thead>
            <tbody>
              {plan.ladderSteps.map((step) => (
                <tr
                  key={step.level}
                  className={cn(
                    "border-b border-border/60",
                    step.level === legs.length && "bg-primary/[0.06]"
                  )}
                >
                  <td className={cn(TD, "text-primary")}>TP{step.level}</td>
                  <td className={TD}>{fmt.price(step.price)}</td>
                  <td className={TD}>P{step.legIndex + 1}</td>
                  <td className={TD}>{fmt.lot(step.lot)}</td>
                  <td className={cn(TD, "text-profit")}>{fmt.money(step.profitUsd)}</td>
                  <td className={cn(TD, "text-profit")}>{fmt.money(step.cumulativeUsd)}</td>
                  <td className={TD}>{fmt.lot(step.remainingLot)}</td>
                  <td className={cn(TD, step.ifReversedUsd >= 0 ? "text-profit" : "text-loss")}>
                    {fmt.money(step.ifReversedUsd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </Scroller>
          <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">
            {shiftToBreakEven
              ? "Kolom terakhir sudah menghitung SL sisa posisi yang digeser ke BE setelah TP1 kena."
              : "SL sisa posisi dibiarkan di tempat, jadi kolom terakhir masih bisa minus."}
          </p>
        </section>
      )}

      {/* ── Depth scenarios ──────────────────────────────────────────── */}
      {!singlePrice && (
        <section>
          <SectionLabel className="mb-3">Skenario menurut kedalaman harga</SectionLabel>
          <Scroller>
            <thead>
              <tr className="border-b border-border">
                <th className={TH}>Harga masuk sampai</th>
                <th className={TH}>Lot terisi kumulatif</th>
                <th className={TH}>Avg entry</th>
                <th className={TH}>Total profit</th>
                <th className={TH}>Rugi di SL</th>
                <th className={TH}>RR</th>
              </tr>
            </thead>
            <tbody>
              {plan.depthCases.map((c) => (
                <tr
                  key={c.filled}
                  className={cn(
                    "border-b border-border/60",
                    c.filled === legs.length && "bg-primary/[0.06]"
                  )}
                >
                  <td className={cn(TD, "text-primary")}>
                    P{c.filled}
                    {c.filled === 1 ? " saja" : ""}
                  </td>
                  <td className={TD}>{fmt.lot(c.lotFilled)}</td>
                  <td className={TD}>{fmt.price(c.avgEntry)}</td>
                  <td className={cn(TD, "text-profit")}>{fmt.money(c.profitUsd)}</td>
                  <td className={cn(TD, "text-loss")}>{fmt.money(c.lossUsd)}</td>
                  <td className={cn(TD, "text-primary")}>1 : {c.rr.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </Scroller>
          <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">
            Kolom lot bersifat kumulatif — total semua layer yang sudah terisi sampai kedalaman
            itu, bukan lot per layer.
          </p>
        </section>
      )}
    </div>
  );
}
