// Position sizing and risk maths for the lot calculator.
//
// Deliberately free of React and the DOM: this is the part that decides how much
// money is at stake, so it stays a pure function that can be reasoned about and
// checked in isolation. Components only render what comes back.

export type Direction = "buy" | "sell";
/** split = one price, several take-profits · layered = several prices · single = one order. */
export type EntryMode = "split" | "layered" | "single";
export type ExitMode = "ladder" | "be" | "single";
/** How lot size is spread across layers. */
export type Distribution = "flat" | "down" | "up";
/** Which layer is assigned to which take-profit level. */
export type LayerMapping = "fwd" | "rev";

export interface LotPlanInput {
  /** Units per 1.00 lot. */
  contractSize: number;
  pipSize: number;
  /** Value of one unit of the quote currency in USD. */
  quoteRate: number;
  /** Account equity in USD (cent accounts converted before calling). */
  balanceUsd: number;
  /** Risk budget for this position in USD. */
  riskBudgetUsd: number;
  direction: Direction;
  entry: number;
  stopLoss: number;
  /** Furthest take-profit. */
  takeProfit: number;
  entryMode: EntryMode;
  exitMode: ExitMode;
  /** Layers / take-profit slices. Ignored when entryMode is "single". */
  layers: number;
  distribution: Distribution;
  /** Depth of the layered entry zone as a percentage of the entry→SL distance. */
  zonePercent: number;
  /** Broker lot increment, e.g. 0.01. */
  lotStep: number;
  /** Distance to the first take-profit, in pips. Only used when laddering. */
  tp1Pip: number;
  mapping: LayerMapping;
  /** Move the remaining stops to break-even once TP1 is hit. */
  shiftToBreakEven: boolean;
  /** Thin profit above break-even, in pips, for the staged-BE exit. */
  thinPip: number;
}

export interface PlanLeg {
  /** 0-based layer index. */
  index: number;
  price: number;
  lot: number;
  /** Price this leg is closed at. */
  target: number;
  /** Distance from this leg's entry to the stop, in pips. */
  pipsToStop: number;
  /** Loss contributed by this leg if the stop is hit, in USD. */
  lossUsd: number;
  /** True for the leg left running to the furthest target. */
  isRunner: boolean;
}

export interface LadderStep {
  /** 1-based take-profit level. */
  level: number;
  price: number;
  /** Index of the leg closed at this level. */
  legIndex: number;
  lot: number;
  profitUsd: number;
  cumulativeUsd: number;
  /** Lot still open after this level. */
  remainingLot: number;
  /** Result if price reverses to the stop from here. */
  ifReversedUsd: number;
}

export interface DepthCase {
  /** Number of layers filled. */
  filled: number;
  lotFilled: number;
  avgEntry: number;
  profitUsd: number;
  lossUsd: number;
  rr: number;
}

export interface LotPlan {
  /** USD value of a 1.0 price move on 1.00 lot. */
  valuePerUnit: number;
  /** USD value of one pip on 1.00 lot. */
  pipValuePerLot: number;
  legs: PlanLeg[];
  totalLot: number;
  avgEntry: number;
  /** Unrounded ideal lot before the broker step was applied. */
  idealLot: number;
  stopLoss: number;
  takeProfit: number;
  takeProfitLevels: number[];
  /** Entry→SL distance from the first layer. */
  pipsToStopFromFirst: number;
  /** Average-entry→SL distance. */
  effectivePipsToStop: number;
  effectivePipsToTarget: number;
  /** Weighted average distance to each leg's own target. */
  avgPipsToTarget: number;
  entryZoneDepthPips: number;
  ladderSteps: LadderStep[];
  depthCases: DepthCase[];
  /** Outcome with every layer filled. */
  full: DepthCase;
  rr: number;
  /** Win rate needed to break even at this RR, as a percentage. */
  breakEvenWinRate: number;
  /** RR measured entry→furthest TP, ignoring layering. */
  nominalRr: number;
  riskBudgetUsd: number;
  /** True when the plan produces laddered take-profits. */
  isLadder: boolean;
  /** True for the staged break-even exit. */
  isStagedBreakEven: boolean;
  allLotsEqual: boolean;
  warnings: string[];
}

const round4 = (x: number) => parseFloat(x.toFixed(4));

/**
 * Distribute `budget` across legs using largest-remainder, never exceeding it.
 *
 * Each leg is floored to the broker's lot step first — which always leaves some
 * budget unspent — then the leftover is handed out one step at a time, biggest
 * shortfall first, skipping any leg whose next step would breach the budget.
 * The guarantee that matters: total loss at the stop is <= the risk budget.
 */
function allocate(
  weights: number[],
  budget: number,
  costPerLot: number[],
  step: number
): { lots: number[]; usedUsd: number; idealTotal: number } {
  const riskPerUnitLot = weights.reduce((sum, w, i) => sum + w * costPerLot[i], 0);
  const idealTotal = riskPerUnitLot > 0 ? budget / riskPerUnitLot : 0;
  const target = weights.map((w) => idealTotal * w);

  const lots = target.map((t) => Math.max(0, Math.floor(t / step + 1e-9) * step));
  let usedUsd = lots.reduce((sum, lot, i) => sum + lot * costPerLot[i], 0);

  target
    .map((t, i) => ({ i, remainder: t - lots[i] }))
    .sort((a, b) => b.remainder - a.remainder)
    .forEach(({ i }) => {
      if (usedUsd + step * costPerLot[i] <= budget + 1e-9) {
        lots[i] += step;
        usedUsd += step * costPerLot[i];
      }
    });

  return { lots: lots.map(round4), usedUsd, idealTotal };
}

const fmtPip = (x: number) => x.toLocaleString("id-ID", { maximumFractionDigits: 1 });

export function computeLotPlan(input: LotPlanInput): LotPlan {
  const {
    contractSize,
    pipSize,
    quoteRate,
    balanceUsd,
    riskBudgetUsd,
    direction,
    entry,
    stopLoss,
    takeProfit,
    entryMode,
    exitMode,
    distribution,
    lotStep,
    mapping,
    shiftToBreakEven,
  } = input;

  const sign = direction === "buy" ? 1 : -1;
  const valuePerUnit = contractSize * quoteRate;
  const pipValuePerLot = valuePerUnit * pipSize;

  const distSL = Math.abs(entry - stopLoss);
  const distTP = Math.abs(takeProfit - entry);

  const isSplit = entryMode === "split";
  const isSingle = entryMode === "single";
  const n = isSingle ? 1 : Math.max(1, input.layers);

  const isLadder = (isSplit || exitMode === "ladder") && n > 1;
  const isStagedBreakEven = !isSplit && exitMode === "be" && n > 1;
  const thinPip = isStagedBreakEven ? Math.max(input.thinPip, 0) : 0;
  const thin = thinPip * pipSize;

  // Only a layered entry spreads across prices; the other modes sit on one.
  const zonePercent = isSplit || isSingle ? 0 : Math.min(Math.max(input.zonePercent, 0), 95);
  const depth = distSL * (zonePercent / 100);

  const prices: number[] = [];
  const weights: number[] = [];
  for (let i = 0; i < n; i++) {
    const f = n === 1 ? 0 : i / (n - 1);
    prices.push(entry - sign * depth * f);
    weights.push(distribution === "flat" ? 1 : distribution === "down" ? i + 1 : n - i);
  }
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const weightsN = weights.map((w) => w / weightSum);

  const costPerLot = prices.map((p) => Math.abs(p - stopLoss) * valuePerUnit);
  const { lots, idealTotal } = allocate(weightsN, riskBudgetUsd, costPerLot, lotStep);

  const totalLot = round4(lots.reduce((a, b) => a + b, 0));
  const avgEntry =
    totalLot > 0 ? prices.reduce((sum, p, i) => sum + lots[i] * p, 0) / totalLot : entry;

  const effectiveSL = Math.abs(avgEntry - stopLoss);
  const effectiveTP = Math.abs(takeProfit - avgEntry);
  const allLotsEqual = lots.every((x) => Math.abs(x - lots[0]) < 1e-9);

  const tpNPip = pipSize > 0 ? distTP / pipSize : 0;
  const tp1Pip = isLadder ? Math.max(input.tp1Pip, 0) : tpNPip;

  const takeProfitLevels: number[] = [];
  for (let j = 0; j < n; j++) {
    const f = n === 1 ? 1 : j / (n - 1);
    const pips = isLadder ? tp1Pip + (tpNPip - tp1Pip) * f : tpNPip;
    takeProfitLevels.push(entry + sign * pips * pipSize);
  }

  // fwd: layer 1 takes TP1. rev: layer 1 runs to the furthest target instead.
  const levelOfLeg = (i: number) => (mapping === "fwd" ? i : n - 1 - i);
  const legAtLevel = (j: number) => (mapping === "fwd" ? j : n - 1 - j);
  const targetOfLeg = (i: number) =>
    isLadder ? takeProfitLevels[levelOfLeg(i)] : takeProfit;

  // Under staged break-even only the last-filled leg runs to target; the ones
  // before it are closed at break-even plus the thin margin.
  function exitDistance(i: number, lastFilled: number): number {
    if (isStagedBreakEven) {
      return i < lastFilled ? thin : Math.abs(takeProfit - prices[i]);
    }
    return Math.abs(targetOfLeg(i) - prices[i]);
  }

  function depthCase(k: number): DepthCase {
    let lotFilled = 0;
    let lossUsd = 0;
    let profitUsd = 0;
    for (let i = 0; i < k; i++) {
      lotFilled += lots[i];
      lossUsd += lots[i] * Math.abs(prices[i] - stopLoss) * valuePerUnit;
      profitUsd += lots[i] * exitDistance(i, k - 1) * valuePerUnit;
    }
    const avg =
      lotFilled > 0
        ? prices.slice(0, k).reduce((sum, p, i) => sum + lots[i] * p, 0) / lotFilled
        : prices[0];
    return {
      filled: k,
      lotFilled: round4(lotFilled),
      avgEntry: avg,
      profitUsd,
      lossUsd,
      rr: lossUsd > 0 ? profitUsd / lossUsd : 0,
    };
  }

  const depthCases: DepthCase[] = [];
  for (let k = 1; k <= n; k++) depthCases.push(depthCase(k));
  const full = depthCases[n - 1];

  const legs: PlanLeg[] = prices.map((price, i) => {
    const d = Math.abs(price - stopLoss);
    const isRunner = isStagedBreakEven
      ? i === n - 1
      : isLadder
      ? levelOfLeg(i) === n - 1
      : false;
    const target = isStagedBreakEven
      ? i === n - 1
        ? takeProfit
        : price + sign * thin
      : targetOfLeg(i);
    return {
      index: i,
      price,
      lot: lots[i],
      target,
      pipsToStop: pipSize > 0 ? d / pipSize : 0,
      lossUsd: lots[i] * d * valuePerUnit,
      isRunner,
    };
  });

  const ladderSteps: LadderStep[] = [];
  if (isLadder) {
    let cumulative = 0;
    takeProfitLevels.forEach((price, j) => {
      const i = legAtLevel(j);
      const profitUsd = lots[i] * Math.abs(price - prices[i]) * valuePerUnit;
      cumulative += profitUsd;

      // Legs mapped to a level beyond this one are still open.
      let remainingLot = 0;
      let remainingLoss = 0;
      for (let q = 0; q < n; q++) {
        if (levelOfLeg(q) > j) {
          remainingLot += lots[q];
          remainingLoss += lots[q] * Math.abs(prices[q] - stopLoss) * valuePerUnit;
        }
      }

      ladderSteps.push({
        level: j + 1,
        price,
        legIndex: i,
        lot: lots[i],
        profitUsd,
        cumulativeUsd: cumulative,
        remainingLot: round4(remainingLot),
        // With stops moved to break-even the banked profit is safe; without it
        // the open legs can still give it back.
        ifReversedUsd: shiftToBreakEven ? cumulative : cumulative - remainingLoss,
      });
    });
  }

  const avgPipsToTarget =
    totalLot > 0 && pipSize > 0
      ? prices.reduce((sum, p, i) => sum + lots[i] * Math.abs(targetOfLeg(i) - p), 0) /
        totalLot /
        pipSize
      : 0;

  const rr = full.rr;

  const warnings: string[] = [];
  if (distSL === 0) {
    warnings.push("Jarak SL masih nol — isi dulu supaya lot bisa dihitung.");
  } else if (lots.some((x) => x < lotStep)) {
    warnings.push(
      `Ada posisi yang lotnya di bawah minimum ${lotStep}. Kurangi jumlah cacahan, atau naikkan modal / risiko.`
    );
  }
  const wrongSide =
    direction === "buy"
      ? stopLoss >= entry || takeProfit <= entry
      : stopLoss <= entry || takeProfit >= entry;
  if (wrongSide) {
    warnings.push(`Harga SL/TP ada di sisi yang salah untuk posisi ${direction.toUpperCase()}.`);
  }
  if (balanceUsd > 0 && riskBudgetUsd / balanceUsd > 0.03) {
    warnings.push("Risiko di atas 3% per posisi — drawdown cepat kalau loss beruntun.");
  }
  if (zonePercent > 80) {
    warnings.push("Zona cacah lebih dari 80% jarak SL — posisi terakhir nyaris menempel SL.");
  }
  if (isStagedBreakEven && thinPip === 0) {
    warnings.push("TP tipis 0 pip berarti BE murni — setelah spread, exit-nya masih minus tipis.");
  }
  if (isLadder && tp1Pip >= tpNPip) {
    warnings.push("TP1 harus lebih dekat dari TP terjauh.");
  } else if (isLadder && distSL > 0 && pipSize > 0 && tp1Pip < distSL / pipSize) {
    warnings.push(
      `TP1 (${fmtPip(tp1Pip)} pip) lebih pendek dari jarak SL (${fmtPip(distSL / pipSize)} pip) — cacahan pertama keluar dengan RR di bawah 1:1.`
    );
  }

  return {
    valuePerUnit,
    pipValuePerLot,
    legs,
    totalLot,
    avgEntry,
    idealLot: idealTotal,
    stopLoss,
    takeProfit,
    takeProfitLevels,
    pipsToStopFromFirst: pipSize > 0 ? distSL / pipSize : 0,
    effectivePipsToStop: pipSize > 0 ? effectiveSL / pipSize : 0,
    effectivePipsToTarget: pipSize > 0 ? effectiveTP / pipSize : 0,
    avgPipsToTarget,
    entryZoneDepthPips: pipSize > 0 ? depth / pipSize : 0,
    ladderSteps,
    depthCases,
    full,
    rr,
    breakEvenWinRate: rr > 0 ? 100 / (1 + rr) : 0,
    nominalRr: distSL > 0 ? distTP / distSL : 0,
    riskBudgetUsd,
    isLadder,
    isStagedBreakEven,
    allLotsEqual,
    warnings,
  };
}
