"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/select";
import { TradeFormDialog, type TradeFormValues } from "@/components/trades/trade-form-dialog";
import { CalcField, ChipActions, ChipGroup, SectionLabel } from "@/components/calculator/chips";
import { PriceRail } from "@/components/calculator/price-rail";
import { PlanTables } from "@/components/calculator/plan-tables";
import { PlanStats } from "@/components/calculator/plan-stats";
import {
  DEFAULT_INSTRUMENT_KEY,
  INSTRUMENT_GROUPS,
  QUOTE_TO_USD,
  derivesQuoteRateFromPrice,
  findInstrument,
  instrumentKey,
} from "@/lib/instruments";
import {
  computeLotPlan,
  type Distribution,
  type EntryMode,
  type ExitMode,
  type LayerMapping,
} from "@/lib/lot-calculator";
import { formatCentWithUsd, cn } from "@/lib/utils";
import { formatIdr } from "@/lib/exchange-rates";

export interface CalculatorAccount {
  id: string;
  name: string;
  currency: string;
  marketType: string;
  totalBalance: number;
}

const MANUAL = "__manual__";

export function LotCalculator({
  accounts,
  usdToIdr,
  ratesDate,
}: {
  accounts: CalculatorAccount[];
  usdToIdr: number | null;
  ratesDate: string | null;
}) {
  // ── instrument ──────────────────────────────────────────────────────
  const [instKey, setInstKey] = useState(DEFAULT_INSTRUMENT_KEY);
  const inst = findInstrument(instKey)!;
  const derivedQuote = derivesQuoteRateFromPrice(inst);

  // ── account & money ─────────────────────────────────────────────────
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id ?? MANUAL);
  const account = accounts.find((a) => a.id === accountId);
  // A cent account quotes everything in USD cents; the app already models this
  // as the USC currency, so it is read rather than asked for.
  const isCent = account?.currency === "USC";
  const unit = isCent ? 100 : 1;

  const [balanceInput, setBalanceInput] = useState<string>(
    accounts[0] ? String(Math.round(accounts[0].totalBalance)) : "1000"
  );
  const balanceUsd = (parseFloat(balanceInput) || 0) / unit;

  const [kurs, setKurs] = useState<string>(String(usdToIdr ? Math.round(usdToIdr) : 16300));

  // ── contract spec, seeded from the instrument but editable ──────────
  const [specKey, setSpecKey] = useState(instKey + "|" + unit);
  const [contractSize, setContractSize] = useState(String(inst.contractSize / unit));
  const [pipSize, setPipSize] = useState(String(inst.pipSize));
  const [quoteRate, setQuoteRate] = useState(String(QUOTE_TO_USD[inst.quote] ?? 1));
  const [entry, setEntry] = useState(inst.refPrice.toFixed(inst.digits));
  const [slPrice, setSlPrice] = useState((inst.refPrice - 100 * inst.pipSize).toFixed(inst.digits));
  const [tpPrice, setTpPrice] = useState((inst.refPrice + 200 * inst.pipSize).toFixed(inst.digits));

  // Re-seed whenever the instrument or the cent/standard basis changes.
  const wantSpecKey = instKey + "|" + unit;
  if (specKey !== wantSpecKey) {
    setSpecKey(wantSpecKey);
    setContractSize(String(inst.contractSize / unit));
    setPipSize(String(inst.pipSize));
    setQuoteRate(String(QUOTE_TO_USD[inst.quote] ?? 1));
    setEntry(inst.refPrice.toFixed(inst.digits));
    setSlPrice((inst.refPrice - 100 * inst.pipSize).toFixed(inst.digits));
    setTpPrice((inst.refPrice + 200 * inst.pipSize).toFixed(inst.digits));
  }

  // ── risk ────────────────────────────────────────────────────────────
  const [riskMode, setRiskMode] = useState<"pct" | "amt">("pct");
  const [riskPct, setRiskPct] = useState("1");
  const [riskAmt, setRiskAmt] = useState("10");
  const [lotStep, setLotStep] = useState(0.01);

  // ── setup ───────────────────────────────────────────────────────────
  const [inputMode, setInputMode] = useState<"pip" | "price">("pip");
  const [direction, setDirection] = useState<"buy" | "sell">("buy");
  const [slPip, setSlPip] = useState("100");
  const [tpPip, setTpPip] = useState("200");

  // ── entry & exit strategy ───────────────────────────────────────────
  const [entryMode, setEntryMode] = useState<EntryMode>("split");
  const [exitMode, setExitMode] = useState<ExitMode>("ladder");
  const [layers, setLayers] = useState(3);
  const [zonePercent, setZonePercent] = useState("60");
  const [distribution, setDistribution] = useState<Distribution>("flat");
  const [tp1Pip, setTp1Pip] = useState("100");
  const [mapping, setMapping] = useState<LayerMapping>("fwd");
  const [shiftToBreakEven, setShiftToBreakEven] = useState(true);
  const [thinPip, setThinPip] = useState("5");

  const n = parseFloat(pipSize) || 0.0001;
  const entryNum = parseFloat(entry) || 0;
  const sign = direction === "buy" ? 1 : -1;

  const effQuoteRate = derivedQuote
    ? entryNum > 0
      ? 1 / entryNum
      : 1
    : parseFloat(quoteRate) || 1;

  const sl =
    inputMode === "pip" ? entryNum - sign * (parseFloat(slPip) || 0) * n : parseFloat(slPrice) || 0;
  const tp =
    inputMode === "pip" ? entryNum + sign * (parseFloat(tpPip) || 0) * n : parseFloat(tpPrice) || 0;

  const riskBudgetUsd =
    riskMode === "pct"
      ? (balanceUsd * (parseFloat(riskPct) || 0)) / 100
      : (parseFloat(riskAmt) || 0) / unit;

  const plan = useMemo(
    () =>
      computeLotPlan({
        contractSize: parseFloat(contractSize) || 1,
        pipSize: n,
        quoteRate: effQuoteRate,
        balanceUsd,
        riskBudgetUsd,
        direction,
        entry: entryNum,
        stopLoss: sl,
        takeProfit: tp,
        entryMode,
        exitMode,
        layers,
        distribution,
        zonePercent: parseFloat(zonePercent) || 0,
        lotStep,
        tp1Pip: parseFloat(tp1Pip) || 0,
        mapping,
        shiftToBreakEven,
        thinPip: parseFloat(thinPip) || 0,
      }),
    [contractSize, n, effQuoteRate, balanceUsd, riskBudgetUsd, direction, entryNum, sl, tp,
     entryMode, exitMode, layers, distribution, zonePercent, lotStep, tp1Pip, mapping,
     shiftToBreakEven, thinPip]
  );

  // ── formatting ──────────────────────────────────────────────────────
  const lotDecimals = lotStep === 1 ? 0 : lotStep === 0.1 ? 1 : 2;
  const fmtLot = (x: number) => x.toFixed(lotDecimals);
  const fmtPrice = (p: number) =>
    p.toLocaleString("en-US", { minimumFractionDigits: inst.digits, maximumFractionDigits: inst.digits });
  const fmtPips = (p: number) => p.toLocaleString("id-ID", { maximumFractionDigits: 1 });
  const fmtMoney = (usd: number) => {
    const v = Math.abs(usd * unit);
    const body = v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (usd < 0 ? "−" : "") + (isCent ? `¢${body}` : `$${body}`);
  };
  const kursNum = parseFloat(kurs) || 0;
  const fmtSecondary = (usd: number) =>
    [
      isCent ? formatCentWithUsd(Math.abs(usd * 100), "") : null,
      kursNum ? formatIdr(Math.abs(usd) * kursNum) : null,
      balanceUsd ? `${((usd / balanceUsd) * 100).toFixed(2)}% modal` : null,
    ]
      .filter(Boolean)
      .join(" · ");

  const isSplit = entryMode === "split";
  const isSingle = entryMode === "single";
  const singlePrice = isSplit || isSingle;
  const tpNPip = n > 0 ? Math.abs(tp - entryNum) / n : 0;

  // ── hand-off to the journal ─────────────────────────────────────────
  const [draft, setDraft] = useState<Partial<TradeFormValues> | null>(null);
  const [draftKey, setDraftKey] = useState(0);
  const [ticketOpen, setTicketOpen] = useState(false);

  function sendToJournal() {
    const layerPrices = plan.legs.map((l) => l.price);
    setDraft({
      accountId: account?.id,
      // "USOIL · WTI" is a display label; the journal wants the ticker.
      symbol: inst.symbol.split(" · ")[0],
      direction: direction === "buy" ? "LONG" : "SHORT",
      status: "OPEN",
      openTime: new Date().toISOString(),
      openPrice: singlePrice ? entryNum : plan.avgEntry,
      lotSize: plan.totalLot,
      stopLoss: plan.stopLoss,
      takeProfit: plan.takeProfit,
      riskPercent:
        balanceUsd > 0 ? parseFloat(((riskBudgetUsd / balanceUsd) * 100).toFixed(2)) : null,
      entryMode: entryMode === "layered" ? "MULTI_LAYER" : "SINGLE",
      ...(entryMode === "layered"
        ? {
            priceRangeHigh: Math.max(...layerPrices),
            priceRangeLow: Math.min(...layerPrices),
            layerCount: plan.legs.length,
          }
        : {}),
    });
    // The ticket reads its defaults on mount and stays mounted while closed, so
    // it has to be remounted for a new draft to land.
    setDraftKey((k) => k + 1);
    setTicketOpen(true);
  }

  const accountOptions = accounts.map((a) => ({ id: a.id, label: `${a.name} (${a.currency})` }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="font-display text-[17px] font-semibold tracking-tight">
            Kalkulator Lot &amp; Risiko
          </h1>
          <p className="num mt-0.5 text-[11px] text-muted-foreground">
            {inst.symbol} · 1.00 lot = {(parseFloat(contractSize) || 0).toLocaleString("en-US")} unit ·
            1 pip = {pipSize} · nilai pip = {fmtMoney(plan.pipValuePerLot)} per lot
            {inst.quote !== "USD" ? ` · quote ${inst.quote}` : ""}
          </p>
        </div>
        <Button onClick={sendToJournal} disabled={plan.totalLot <= 0} className="gap-1.5">
          Catat sebagai trade
          <ArrowRight className="size-3.5" />
        </Button>
      </div>

      {plan.warnings.length > 0 && (
        <div className="flex gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-brand-ink" />
          <ul className="space-y-1 text-[11.5px] leading-relaxed">
            {plan.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
        {/* ══ INPUT ══════════════════════════════════════════════════ */}
        <section className="space-y-4 rounded-lg border border-border bg-card p-4">
          <SectionLabel>Instrumen</SectionLabel>

          <CalcField label="Pilih pair / komoditas / indeks">
            <Select value={instKey} onValueChange={(v) => v && setInstKey(v as string)}>
              <SelectTrigger className="w-full">
                <span className="num flex flex-1 text-left text-sm">{inst.symbol}</span>
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {Object.entries(INSTRUMENT_GROUPS).map(([groupName, items]) => (
                  <SelectGroup key={groupName}>
                    <SelectLabel>{groupName}</SelectLabel>
                    {items.map((it) => (
                      <SelectItem key={it.symbol} value={instrumentKey(groupName, it.symbol)}>
                        {it.symbol}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </CalcField>

          <div className="grid grid-cols-2 gap-3">
            <CalcField label="Contract size — unit per 1.00 lot" htmlFor="cs">
              <Input id="cs" type="number" step="any" inputMode="decimal" className="num text-right"
                value={contractSize} onChange={(e) => setContractSize(e.target.value)} />
            </CalcField>
            <CalcField label="Ukuran 1 pip (harga)" htmlFor="pip">
              <Input id="pip" type="number" step="any" inputMode="decimal" className="num text-right"
                value={pipSize} onChange={(e) => setPipSize(e.target.value)} />
            </CalcField>
          </div>

          {inst.quote !== "USD" && (
            <CalcField
              label={`Nilai 1 ${inst.quote} dalam USD`}
              htmlFor="qrate"
              hint={
                derivedQuote
                  ? `Dihitung otomatis dari harga: 1 ${inst.quote} = 1 ÷ harga ${inst.symbol}.`
                  : `Perkiraan kasar — ganti dengan kurs ${inst.quote}/USD hari ini supaya sizing-nya akurat.`
              }
            >
              <Input
                id="qrate" type="number" step="any" inputMode="decimal" className="num text-right"
                readOnly={derivedQuote}
                value={derivedQuote ? effQuoteRate.toFixed(6) : quoteRate}
                onChange={(e) => setQuoteRate(e.target.value)}
              />
            </CalcField>
          )}

          <div className="border-t border-border pt-4">
            <SectionLabel className="mb-3">Akun</SectionLabel>

            <CalcField label="Ambil modal dari akun" className="mb-3">
              <Select
                value={accountId}
                onValueChange={(v) => {
                  if (!v) return;
                  setAccountId(v as string);
                  const acc = accounts.find((a) => a.id === v);
                  if (acc) setBalanceInput(String(Math.round(acc.totalBalance)));
                }}
              >
                <SelectTrigger className="w-full">
                  <span className="flex flex-1 text-left text-sm">
                    {account
                      ? `${account.name} (${account.currency})`
                      : "Isi modal manual"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MANUAL}>Isi modal manual</SelectItem>
                  {accountOptions.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CalcField>

            <div className="grid grid-cols-2 gap-3">
              <CalcField label={isCent ? "Modal (¢)" : "Modal (USD)"} htmlFor="bal">
                <Input id="bal" type="number" step="any" inputMode="decimal" className="num text-right"
                  value={balanceInput} onChange={(e) => setBalanceInput(e.target.value)} />
              </CalcField>
              <CalcField label="Kelipatan lot broker">
                <ChipGroup
                  value={lotStep}
                  onChange={setLotStep}
                  options={[
                    { value: 0.01, label: "0.01" },
                    { value: 0.1, label: "0.10" },
                    { value: 1, label: "1.00" },
                  ]}
                />
              </CalcField>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <SectionLabel className="mb-3">Risiko</SectionLabel>
            <ChipGroup
              className="mb-3"
              value={riskMode}
              onChange={setRiskMode}
              options={[
                { value: "pct" as const, label: "% dari modal" },
                { value: "amt" as const, label: "Nominal" },
              ]}
            />
            {riskMode === "pct" ? (
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" step="any" inputMode="decimal" className="num text-right"
                  value={riskPct} onChange={(e) => setRiskPct(e.target.value)} />
                <ChipActions
                  options={[
                    { value: 0.5, label: "0.5%" },
                    { value: 1, label: "1%" },
                    { value: 2, label: "2%" },
                  ]}
                  onSelect={(v) => setRiskPct(String(v))}
                />
              </div>
            ) : (
              <Input type="number" step="any" inputMode="decimal" className="num text-right"
                value={riskAmt} onChange={(e) => setRiskAmt(e.target.value)} />
            )}
          </div>

          <div className="border-t border-border pt-4">
            <SectionLabel className="mb-3">Setup harga</SectionLabel>

            <CalcField label="Cara isi SL &amp; TP" className="mb-3">
              <ChipGroup
                value={inputMode}
                onChange={setInputMode}
                options={[
                  { value: "pip" as const, label: "Jarak pip" },
                  { value: "price" as const, label: "Harga" },
                ]}
              />
            </CalcField>

            <CalcField
              label={
                isSplit
                  ? "Harga entry — sama untuk semua order"
                  : isSingle
                  ? "Harga entry"
                  : "Harga entry (layer 1)"
              }
              htmlFor="entry"
              className="mb-3"
            >
              <Input id="entry" type="number" step="any" inputMode="decimal" className="num text-right"
                value={entry} onChange={(e) => setEntry(e.target.value)} />
            </CalcField>

            <CalcField label="Arah posisi" className="mb-3">
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={direction === "buy" ? "long" : "secondary"}
                  className={cn("h-10", direction !== "buy" && "text-muted-foreground")}
                  onClick={() => setDirection("buy")}>BUY</Button>
                <Button type="button" variant={direction === "sell" ? "short" : "secondary"}
                  className={cn("h-10", direction !== "sell" && "text-muted-foreground")}
                  onClick={() => setDirection("sell")}>SELL</Button>
              </div>
            </CalcField>

            {inputMode === "pip" ? (
              <>
                <div className="mb-3 grid grid-cols-2 gap-3">
                  <CalcField label="Jarak SL (pip)" htmlFor="slpip">
                    <Input id="slpip" type="number" step="any" inputMode="decimal" className="num text-right"
                      value={slPip} onChange={(e) => setSlPip(e.target.value)} />
                  </CalcField>
                  <CalcField label="Jarak TP terjauh (pip)" htmlFor="tppip">
                    <Input id="tppip" type="number" step="any" inputMode="decimal" className="num text-right"
                      value={tpPip} onChange={(e) => setTpPip(e.target.value)} />
                  </CalcField>
                </div>
                <ChipActions
                  className="mb-3"
                  options={[20, 50, 100, 150, 200].map((v) => ({ value: v, label: `SL ${v}` }))}
                  onSelect={(v) => setSlPip(String(v))}
                />
              </>
            ) : (
              <div className="mb-3 grid grid-cols-2 gap-3">
                <CalcField label="Harga stop loss" htmlFor="slp">
                  <Input id="slp" type="number" step="any" inputMode="decimal" className="num text-right"
                    value={slPrice} onChange={(e) => setSlPrice(e.target.value)} />
                </CalcField>
                <CalcField label="Harga TP terjauh" htmlFor="tpp">
                  <Input id="tpp" type="number" step="any" inputMode="decimal" className="num text-right"
                    value={tpPrice} onChange={(e) => setTpPrice(e.target.value)} />
                </CalcField>
              </div>
            )}

            <CalcField label="Set TP terjauh dari RR nominal">
              <ChipActions
                options={[1, 1.5, 2, 3].map((v) => ({ value: v, label: `1 : ${v}` }))}
                onSelect={(rr) => {
                  if (inputMode === "pip") {
                    setTpPip(((parseFloat(slPip) || 0) * rr).toFixed(1));
                  } else {
                    const d = Math.abs(entryNum - (parseFloat(slPrice) || 0));
                    if (d > 0) {
                      setTpPrice(
                        (direction === "buy" ? entryNum + d * rr : entryNum - d * rr).toFixed(inst.digits)
                      );
                    }
                  }
                }}
              />
            </CalcField>
          </div>

          <div className="border-t border-border pt-4">
            <SectionLabel className="mb-3">Mode entry</SectionLabel>
            <ChipGroup
              value={entryMode}
              onChange={(v) => {
                setEntryMode(v);
                // A split entry is defined by its laddered targets — the other
                // exits have no meaning when every order shares one price.
                if (v === "split") setExitMode("ladder");
              }}
              options={[
                { value: "split" as const, label: "Cacah TP · satu harga" },
                { value: "layered" as const, label: "Cacah harga · berlapis" },
                { value: "single" as const, label: "Posisi tunggal" },
              ]}
            />
            <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">
              {isSplit
                ? "Semua order dibuka di satu harga dengan SL identik. Yang dipecah hanya TP-nya."
                : isSingle
                ? "Satu order, satu SL, satu TP."
                : "Order disebar di beberapa harga menuju SL; entry rata-rata membaik kalau harga retrace."}
            </p>

            {!isSingle && (
              <div className="mt-3 space-y-3">
                <CalcField label={isSplit ? "Jumlah cacahan TP" : "Jumlah layer"}>
                  <ChipGroup
                    value={layers}
                    onChange={setLayers}
                    options={[2, 3, 4, 5, 6].map((v) => ({ value: v, label: String(v) }))}
                  />
                </CalcField>

                {!isSplit && (
                  <CalcField label="Kedalaman zona cacah — % dari jarak entry ke SL" htmlFor="zone">
                    <Input id="zone" type="number" step="any" inputMode="decimal" className="num text-right"
                      value={zonePercent} onChange={(e) => setZonePercent(e.target.value)} />
                  </CalcField>
                )}

                <CalcField label="Distribusi lot antar cacahan">
                  <ChipGroup
                    value={distribution}
                    onChange={setDistribution}
                    options={[
                      { value: "flat" as const, label: "Rata" },
                      { value: "down" as const, label: "Nambah ke bawah" },
                      { value: "up" as const, label: "Berat di awal" },
                    ]}
                  />
                </CalcField>
              </div>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <SectionLabel className="mb-3">Strategi exit</SectionLabel>

            {!isSplit && (
              <ChipGroup
                className="mb-3"
                value={exitMode}
                onChange={setExitMode}
                options={[
                  { value: "ladder" as const, label: "TP berjenjang" },
                  { value: "be" as const, label: "BE bertahap" },
                  { value: "single" as const, label: "TP tunggal" },
                ]}
              />
            )}

            {!isSplit && exitMode === "be" && (
              <div className="space-y-3">
                <CalcField label="TP tipis di atas BE (pip) — 0 = BE murni" htmlFor="thin">
                  <Input id="thin" type="number" step="any" inputMode="decimal" className="num text-right"
                    value={thinPip} onChange={(e) => setThinPip(e.target.value)} />
                </CalcField>
                <ChipActions
                  options={[
                    { value: 0, label: "BE murni" },
                    { value: 3, label: "+3 pip" },
                    { value: 5, label: "+5 pip" },
                    { value: 10, label: "+10 pip" },
                  ]}
                  onSelect={(v) => setThinPip(String(v))}
                />
              </div>
            )}

            {(isSplit || exitMode === "ladder") && (
              <div className="space-y-3">
                <CalcField label="TP1 — jarak pip dari entry" htmlFor="tp1">
                  <Input id="tp1" type="number" step="any" inputMode="decimal" className="num text-right"
                    value={tp1Pip} onChange={(e) => setTp1Pip(e.target.value)} />
                </CalcField>

                {!isSplit && (
                  <CalcField label="Pemetaan cacahan ke TP">
                    <ChipGroup
                      value={mapping}
                      onChange={setMapping}
                      options={[
                        { value: "fwd" as const, label: "P1→TP1, P2→TP2" },
                        { value: "rev" as const, label: "Dibalik" },
                      ]}
                    />
                  </CalcField>
                )}

                <CalcField label="Begitu TP1 kena, SL sisa posisi geser ke BE">
                  <ChipGroup
                    value={shiftToBreakEven ? "on" : "off"}
                    onChange={(v) => setShiftToBreakEven(v === "on")}
                    options={[
                      { value: "on" as const, label: "Ya" },
                      { value: "off" as const, label: "Tidak" },
                    ]}
                  />
                </CalcField>
              </div>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <CalcField
              label="Kurs USD/IDR"
              htmlFor="kurs"
              hint={ratesDate ? `Kurs ${ratesDate}, bisa ditimpa manual.` : "Kurs otomatis tidak tersedia — isi manual."}
            >
              <Input id="kurs" type="number" step="any" inputMode="decimal" className="num text-right"
                value={kurs} onChange={(e) => setKurs(e.target.value)} />
            </CalcField>
          </div>
        </section>

        {/* ══ HASIL ══════════════════════════════════════════════════ */}
        <section className="space-y-4 rounded-lg border border-border bg-card p-4">
          <SectionLabel>Rekomendasi posisi</SectionLabel>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <p className="num font-display text-[46px] leading-none font-semibold text-primary">
              {fmtLot(plan.totalLot)}
              <span className="ml-2 text-[15px] font-normal text-muted-foreground">lot total</span>
            </p>
            <div className="num text-right text-[11px] leading-relaxed text-muted-foreground">
              <span
                className={cn(
                  "inline-block rounded-sm border px-2 py-0.5 text-[11px] font-bold tracking-[0.14em]",
                  direction === "buy"
                    ? "border-profit/40 bg-profit/12 text-profit"
                    : "border-loss/40 bg-loss/12 text-loss"
                )}
              >
                {direction === "buy" ? "BUY" : "SELL"}
              </span>
              <br />
              <span className="text-[12.5px] text-foreground">
                {isSingle
                  ? `${fmtLot(plan.totalLot)} lot · 1 posisi`
                  : plan.allLotsEqual
                  ? `${plan.legs.length} × ${fmtLot(plan.legs[0].lot)} lot`
                  : `per posisi: ${plan.legs.map((l) => fmtLot(l.lot)).join(" / ")}`}
              </span>
              <br />
              {isSingle
                ? "posisi tunggal"
                : isSplit
                ? `satu harga · ${plan.legs.length} cacahan TP`
                : `${plan.legs.length} layer · zona ${fmtPips(plan.entryZoneDepthPips)} pip`}
              <br />
              {fmtMoney(plan.totalLot * plan.pipValuePerLot)} / pip (total posisi)
            </div>
          </div>

          <PriceRail
            plan={plan}
            digits={inst.digits}
            singlePrice={singlePrice}
            formatMoney={fmtMoney}
            formatLot={fmtLot}
          />

          <PlanTables
            plan={plan}
            singlePrice={singlePrice}
            splitMode={isSplit}
            shiftToBreakEven={shiftToBreakEven}
            fmt={{ price: fmtPrice, money: fmtMoney, lot: fmtLot, pips: fmtPips }}
          />

          <PlanStats
            plan={plan}
            balanceUsd={balanceUsd}
            isLadder={plan.isLadder}
            tp1Pip={parseFloat(tp1Pip) || 0}
            tpNPip={tpNPip}
            fmt={{ money: fmtMoney, pips: fmtPips, secondary: fmtSecondary }}
          />
        </section>
      </div>

      <p className="border-l border-border pl-3 text-[11px] leading-relaxed text-muted-foreground">
        Contract size, ukuran pip, dan kurs quote adalah nilai umum — tiap broker bisa berbeda,
        terutama untuk indeks dan kripto. Cocokkan dulu angka nilai per pip di atas dengan
        spesifikasi di platformmu sebelum eksekusi. Spread, swap, dan komisi belum dihitung, dan
        angka risiko hanya valid kalau SL benar-benar terpasang di semua posisi sejak awal.
      </p>

      {draft && (
        <TradeFormDialog
          key={draftKey}
          accounts={accounts.map((a) => ({
            id: a.id,
            name: a.name,
            marketType: a.marketType,
            currency: a.currency,
          }))}
          mode="create"
          trade={draft}
          open={ticketOpen}
          onOpenChange={setTicketOpen}
        />
      )}
    </div>
  );
}
