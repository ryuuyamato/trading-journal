"use client";

import type { LotPlan } from "@/lib/lot-calculator";
import { cn } from "@/lib/utils";

interface PriceRailProps {
  plan: LotPlan;
  digits: number;
  /** True when every order sits at one price, so no entry zone is drawn. */
  singlePrice: boolean;
  formatMoney: (usd: number) => string;
  formatLot: (lot: number) => string;
}

// Vertical price ladder: stop at one end, target at the other, entry between
// them, with a tick for every layer. Seeing the layers against the stop is the
// point — a zone that creeps toward the stop is obvious here and invisible in a
// table of numbers.
export function PriceRail({
  plan,
  digits,
  singlePrice,
  formatMoney,
  formatLot,
}: PriceRailProps) {
  const { legs, stopLoss, takeProfit, avgEntry, takeProfitLevels, isLadder } = plan;
  const n = legs.length;

  const price = (p: number) => p.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const pips = (p: number) => p.toLocaleString("id-ID", { maximumFractionDigits: 1 });

  // Scale: every drawn price, padded so the outermost markers aren't flush
  // against the edges.
  const all = [avgEntry, stopLoss, takeProfit, ...legs.map((l) => l.price), ...takeProfitLevels].filter(
    (v) => Number.isFinite(v)
  );
  let lo = Math.min(...all);
  let hi = Math.max(...all);
  if (!Number.isFinite(lo) || hi === lo) {
    hi = (lo || 1) * 1.002;
    lo = (lo || 1) * 0.998;
  }
  const pad = (hi - lo) * 0.11;
  lo -= pad;
  hi += pad;
  const y = (p: number) => ((1 - (p - lo) / (hi - lo)) * 100).toFixed(3) + "%";
  const yNum = (p: number) => (1 - (p - lo) / (hi - lo)) * 100;

  const yTP = yNum(takeProfit);
  const yEN = yNum(avgEntry);
  const ySL = yNum(stopLoss);
  const yFirst = yNum(legs[0].price);
  const yLast = yNum(legs[n - 1].price);
  const showZone = !singlePrice && Math.abs(yLast - yFirst) > 0.01;

  const LABEL = "w-20 shrink-0 pr-3 text-right md:w-28";
  const TRACK_LEFT = "left-20 md:left-28";

  return (
    <div className="relative my-6 h-80 md:h-90">
      <div className={cn("absolute top-0 bottom-0 w-px bg-border", TRACK_LEFT)} />

      {showZone && (
        <div
          className={cn("absolute w-7 -translate-x-1/2 border-y border-dashed", TRACK_LEFT)}
          style={{
            top: Math.min(yFirst, yLast) + "%",
            height: Math.abs(yLast - yFirst) + "%",
            backgroundColor: "color-mix(in oklch, var(--primary) 12%, transparent)",
            borderColor: "color-mix(in oklch, var(--primary) 45%, transparent)",
          }}
        />
      )}

      {/* Reward and risk legs of the track, so their relative size is literal. */}
      <div
        className={cn("absolute w-1 -translate-x-1/2 bg-profit", TRACK_LEFT)}
        style={{ top: Math.min(yTP, yEN) + "%", height: Math.abs(yEN - yTP) + "%" }}
      />
      <div
        className={cn("absolute w-1 -translate-x-1/2 bg-loss", TRACK_LEFT)}
        style={{ top: Math.min(ySL, yEN) + "%", height: Math.abs(ySL - yEN) + "%" }}
      />

      {/* Intermediate take-profit levels. */}
      {isLadder &&
        plan.ladderSteps.slice(0, n - 1).map((step) => (
          <div
            key={`tp-${step.level}`}
            className="pointer-events-none absolute inset-x-0 flex -translate-y-1/2 items-center"
            style={{ top: y(step.price) }}
          >
            <span className={cn(LABEL, "num text-[10px] text-profit")}>TP{step.level}</span>
            <span className="-ml-0.5 h-0.5 w-6 shrink-0 bg-profit" />
            <span className="num pl-3 text-[10.5px] text-profit">
              {price(step.price)} · P{step.legIndex + 1} close {formatLot(step.lot)} lot
            </span>
          </div>
        ))}

      {/* One tick per layer. */}
      {!singlePrice &&
        legs.map((leg) => (
          <div
            key={`leg-${leg.index}`}
            className="pointer-events-none absolute inset-x-0 flex -translate-y-1/2 items-center"
            style={{ top: y(leg.price) }}
          >
            <span
              className={cn(
                LABEL,
                "num text-[10px]",
                leg.isRunner ? "text-profit" : "text-primary"
              )}
            >
              P{leg.index + 1}
            </span>
            <span
              className={cn(
                "-ml-0.5 w-6 shrink-0",
                leg.isRunner ? "h-0.75 bg-profit" : "h-0.5 bg-primary"
              )}
            />
            <span
              className={cn(
                "num pl-3 text-[10.5px]",
                leg.isRunner ? "text-profit" : "text-muted-foreground"
              )}
            >
              {price(leg.price)} · {formatLot(leg.lot)} lot
              {leg.isRunner ? " · runner" : ""}
            </span>
          </div>
        ))}

      <RailMark
        top={y(takeProfit)}
        label={isLadder ? `TP${n}` : "TAKE PROFIT"}
        value={price(takeProfit)}
        sub={`+${pips(plan.effectivePipsToTarget)} pip · ${formatMoney(plan.full.profitUsd)}`}
        tone="profit"
        labelClass={LABEL}
      />
      <RailMark
        top={y(avgEntry)}
        label={singlePrice ? "ENTRY" : "AVG ENTRY"}
        value={price(avgEntry)}
        sub={`${formatLot(plan.totalLot)} lot`}
        tone="entry"
        labelClass={LABEL}
      />
      <RailMark
        top={y(stopLoss)}
        label="STOP LOSS"
        value={price(stopLoss)}
        sub={`−${pips(plan.effectivePipsToStop)} pip · ${formatMoney(plan.full.lossUsd)}`}
        tone="loss"
        labelClass={LABEL}
      />
    </div>
  );
}

function RailMark({
  top,
  label,
  value,
  sub,
  tone,
  labelClass,
}: {
  top: string;
  label: string;
  value: string;
  sub: string;
  tone: "profit" | "loss" | "entry";
  labelClass: string;
}) {
  const color =
    tone === "profit" ? "text-profit" : tone === "loss" ? "text-loss" : "text-foreground";
  const dot = tone === "profit" ? "bg-profit" : tone === "loss" ? "bg-loss" : "bg-foreground";

  return (
    <div className="absolute inset-x-0 flex -translate-y-1/2 items-center" style={{ top }}>
      <span
        className={cn(
          labelClass,
          "num text-[10px] tracking-[0.13em] text-muted-foreground uppercase"
        )}
      >
        {label}
      </span>
      {/* The label column is exactly as wide as the track offset, so shifting
          the dot by half its own width lands it on the line. */}
      <span
        className={cn("size-2.5 shrink-0 -translate-x-1/2 rounded-full border border-card", dot)}
      />
      <span className={cn("num pl-2 text-[14px] font-semibold", color)}>{value}</span>
      <span className="num truncate pl-2.5 text-[10.5px] text-muted-foreground">{sub}</span>
    </div>
  );
}
