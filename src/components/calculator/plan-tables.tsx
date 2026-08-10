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

// Tables live from md up. A phone gets stacked cards instead — a six-to-eight
// column grid cannot be made to fit 375px, and making the user swipe sideways
// through their own risk numbers is worse than restacking them.
function DesktopTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="num w-full min-w-140 border-collapse text-[12px]">{children}</table>
    </div>
  );
}

/** One label/value pair inside a phone card. */
function Cell({
  label,
  value,
  tone,
  className,
}: {
  label: string;
  value: string;
  tone?: "profit" | "loss" | "brand";
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[9.5px] tracking-widest text-muted-foreground uppercase">{label}</p>
      <p
        className={cn(
          "num truncate text-[12.5px]",
          tone === "profit"
            ? "text-profit"
            : tone === "loss"
            ? "text-loss"
            : tone === "brand"
            ? "text-primary"
            : "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function PhoneCard({
  title,
  highlight,
  children,
}: {
  title: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li
      className={cn(
        "rounded-md border border-border p-2.5",
        highlight ? "bg-primary/6" : "bg-secondary/40"
      )}
    >
      <p className="num mb-2 text-[11.5px] font-semibold text-primary">{title}</p>
      <div className="grid grid-cols-3 gap-x-3 gap-y-2">{children}</div>
    </li>
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

  const exitLabel = (leg: (typeof legs)[number]) =>
    isStagedBreakEven && !leg.isRunner ? `BE ${fmt.price(leg.target)}` : `TP ${fmt.price(leg.target)}`;

  return (
    <div className="space-y-6">
      {/* ── Legs ─────────────────────────────────────────────────────── */}
      <section>
        <SectionLabel className="mb-3">
          {splitMode ? "Rincian order" : "Rincian posisi"}
        </SectionLabel>

        <ul className="space-y-2 md:hidden">
          {legs.map((leg) => (
            <PhoneCard
              key={leg.index}
              title={`P${leg.index + 1}${leg.isRunner ? " · runner" : ""}`}
              highlight={leg.isRunner}
            >
              <Cell label="Entry" value={fmt.price(leg.price)} />
              <Cell label="Lot" value={fmt.lot(leg.lot)} />
              <Cell label="Pip ke SL" value={fmt.pips(leg.pipsToStop)} />
              <Cell
                label="Target exit"
                value={exitLabel(leg)}
                tone={leg.isRunner ? "profit" : undefined}
                className="col-span-2"
              />
              <Cell label="Rugi di SL" value={fmt.money(leg.lossUsd)} tone="loss" />
            </PhoneCard>
          ))}
          <li className="rounded-md border border-primary/40 bg-primary/10 p-2.5">
            <p className="num mb-2 text-[11.5px] font-semibold text-primary">Total</p>
            <div className="grid grid-cols-3 gap-x-3 gap-y-2">
              <Cell
                label={singlePrice ? "Entry" : "Avg entry"}
                value={fmt.price(singlePrice ? legs[0].price : plan.avgEntry)}
              />
              <Cell label="Lot" value={fmt.lot(plan.totalLot)} tone="brand" />
              <Cell label="Pip ke SL" value={fmt.pips(plan.effectivePipsToStop)} />
              <Cell label="Rugi di SL" value={fmt.money(plan.full.lossUsd)} tone="loss" />
            </div>
          </li>
        </ul>

        <DesktopTable>
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
                className={cn("border-b border-border/60", leg.isRunner && "bg-primary/6")}
              >
                <td className={cn(TD, "text-primary")}>P{leg.index + 1}</td>
                <td className={TD}>{fmt.price(leg.price)}</td>
                <td className={TD}>{fmt.lot(leg.lot)}</td>
                <td className={cn(TD, leg.isRunner ? "text-profit" : "text-muted-foreground")}>
                  {exitLabel(leg)}
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
        </DesktopTable>

        <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">
          {splitMode
            ? `Semua ${legs.length} order dibuka di harga ${fmt.price(legs[0].price)} dengan SL identik di ${fmt.price(plan.stopLoss)}. Yang berbeda hanya TP-nya.`
            : singlePrice
            ? ""
            : `Kolom lot di sini per posisi, bukan kumulatif. Total order = ${fmt.lot(plan.totalLot)} lot.`}
        </p>
      </section>

      {/* ── Ladder ───────────────────────────────────────────────────── */}
      {isLadder && (
        <section>
          <SectionLabel className="mb-3">Panen bertingkat</SectionLabel>

          <ul className="space-y-2 md:hidden">
            {plan.ladderSteps.map((step) => (
              <PhoneCard
                key={step.level}
                title={`TP${step.level} · ${fmt.price(step.price)}`}
                highlight={step.level === legs.length}
              >
                <Cell label="Close" value={`P${step.legIndex + 1}`} />
                <Cell label="Lot" value={fmt.lot(step.lot)} />
                <Cell label="Sisa lot" value={fmt.lot(step.remainingLot)} />
                <Cell label="Profit" value={fmt.money(step.profitUsd)} tone="profit" />
                <Cell label="Kumulatif" value={fmt.money(step.cumulativeUsd)} tone="profit" />
                <Cell
                  label="Balik arah"
                  value={fmt.money(step.ifReversedUsd)}
                  tone={step.ifReversedUsd >= 0 ? "profit" : "loss"}
                />
              </PhoneCard>
            ))}
          </ul>

          <DesktopTable>
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
                    step.level === legs.length && "bg-primary/6"
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
          </DesktopTable>

          <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">
            {shiftToBreakEven
              ? "Kolom balik arah sudah menghitung SL sisa posisi yang digeser ke BE setelah TP1 kena."
              : "SL sisa posisi dibiarkan di tempat, jadi kolom balik arah masih bisa minus."}
          </p>
        </section>
      )}

      {/* ── Depth scenarios ──────────────────────────────────────────── */}
      {!singlePrice && (
        <section>
          <SectionLabel className="mb-3">Skenario menurut kedalaman harga</SectionLabel>

          <ul className="space-y-2 md:hidden">
            {plan.depthCases.map((c) => (
              <PhoneCard
                key={c.filled}
                title={`Masuk sampai P${c.filled}${c.filled === 1 ? " saja" : ""}`}
                highlight={c.filled === legs.length}
              >
                <Cell label="Lot terisi" value={fmt.lot(c.lotFilled)} />
                <Cell label="Avg entry" value={fmt.price(c.avgEntry)} />
                <Cell label="RR" value={`1 : ${c.rr.toFixed(2)}`} tone="brand" />
                <Cell label="Total profit" value={fmt.money(c.profitUsd)} tone="profit" />
                <Cell label="Rugi di SL" value={fmt.money(c.lossUsd)} tone="loss" />
              </PhoneCard>
            ))}
          </ul>

          <DesktopTable>
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
                    c.filled === legs.length && "bg-primary/6"
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
          </DesktopTable>

          <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">
            Lot bersifat kumulatif — total semua layer yang sudah terisi sampai kedalaman itu,
            bukan lot per layer.
          </p>
        </section>
      )}
    </div>
  );
}
