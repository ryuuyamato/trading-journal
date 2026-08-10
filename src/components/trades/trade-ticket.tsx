"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field } from "@/components/trades/ticket-fields/field";
import { MarketFields } from "@/components/trades/ticket-fields/market-fields";
import { PnlFields } from "@/components/trades/ticket-fields/pnl-fields";
import { RiskFields } from "@/components/trades/ticket-fields/risk-fields";
import { NotesFields } from "@/components/trades/ticket-fields/notes-fields";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  TRADE_ASSET_TYPES,
  formatDuration,
  getSymbolSuggestions,
  isCryptoFutures,
  isForexOrCommodity,
  isMultiLayerSupported,
  isStock,
  numStr,
  toDatetimeLocal,
} from "@/lib/trade-form";

interface Account {
  id: string;
  name: string;
  marketType: string;
  currency: string;
}

export interface TradeFormValues {
  id: string;
  accountId: string;
  symbol: string;
  direction: string;
  status: string;
  entryMode: string;
  openTime: string; // ISO
  closeTime: string | null; // ISO
  openPrice: number;
  closePrice: number | null;
  lotSize: number | null;
  swap: number;
  priceRangeHigh: number | null;
  priceRangeLow: number | null;
  layerCount: number | null;
  quantity: number | null;
  buyFee: number;
  sellFee: number;
  taxAmount: number;
  dividend: number;
  leverage: number | null;
  marginMode: string | null;
  fundingRate: number | null;
  grossProfit: number | null;
  commission: number;
  netProfit: number | null;
  rMultiple: number | null;
  pips: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  riskPercent: number | null;
  tradeMarketType: string | null;
  setup: string | null;
  notes: string | null;
  tagIds: string[];
}

// What the field components render defaults from: every value optional, because
// a new trade may start blank or from a calculator draft.
export type TradeDraft = Partial<TradeFormValues>;

interface TradeTicketBaseProps {
  accounts: Account[];
  // Edit mode is always controlled externally (e.g. opened from a row action menu) —
  // no built-in trigger is rendered, the parent owns `open`/`onOpenChange`.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Editing needs a real trade; creating may be seeded with a partial draft — the
// lot calculator hands one over. Discriminating on `mode` keeps `trade.id`
// guaranteed on the edit path, which is the only place it is read.
//
// Note for callers passing a draft: defaults are read on mount and the ticket
// stays mounted while closed, so a changed draft needs a changed `key`.
type TradeTicketProps = TradeTicketBaseProps &
  (
    | { mode: "create"; trade?: Partial<TradeFormValues> }
    | { mode: "edit"; trade: TradeFormValues }
  );

interface TicketSummary {
  netProfit: number | null;
  rMultiple: number | null;
  duration: string | null;
}

export function TradeTicket({
  accounts,
  mode,
  trade,
  open: openProp,
  onOpenChange,
}: TradeTicketProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [isPending, startTransition] = useTransition();

  const [accountId, setAccountId] = useState(trade?.accountId ?? accounts[0]?.id ?? "");
  const [direction, setDirection] = useState(trade?.direction ?? "LONG");
  const [status, setStatus] = useState(trade?.status ?? "CLOSED");
  const [entryMode, setEntryMode] = useState(trade?.entryMode ?? "SINGLE");
  const [marginMode, setMarginMode] = useState(trade?.marginMode ?? "ISOLATED");
  const [tradeAssetType, setTradeAssetType] = useState(trade?.tradeMarketType ?? "");

  const [summary, setSummary] = useState<TicketSummary>({
    netProfit: trade?.netProfit ?? trade?.grossProfit ?? null,
    rMultiple: trade?.rMultiple ?? null,
    duration: formatDuration(
      toDatetimeLocal(trade?.openTime),
      toDatetimeLocal(trade?.closeTime)
    ),
  });

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const accountMarketType = selectedAccount?.marketType ?? "";
  const isMultiAsset = accountMarketType === "MULTI_ASSET";
  const effectiveMarketType = isMultiAsset ? tradeAssetType : accountMarketType;
  const suggestions = getSymbolSuggestions(effectiveMarketType);
  const isLong = direction === "LONG";

  // The form stays uncontrolled (defaultValue + form.elements on submit), so the
  // footer readout is refreshed from a single input listener rather than by
  // making every numeric field stateful.
  function recomputeSummary(form: HTMLFormElement) {
    const get = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | null)?.value ?? "";
    const toNum = (v: string) => {
      const n = parseFloat(v);
      return isNaN(n) ? null : n;
    };

    setSummary({
      netProfit: toNum(get("netProfit")) ?? toNum(get("grossProfit")),
      rMultiple: toNum(get("rMultiple")),
      duration: formatDuration(get("openTime"), get("closeTime")),
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement)?.value ?? "";
    const getNum = (name: string) => {
      const v = parseFloat(get(name));
      return isNaN(v) ? null : v;
    };

    const openTimeStr = get("openTime");
    const openPriceStr = get("openPrice");

    if (!openTimeStr) { toast.error("Waktu buka wajib diisi"); return; }
    if (!openPriceStr) { toast.error("Harga buka wajib diisi"); return; }

    let openTimeISO: string;
    try { openTimeISO = new Date(openTimeStr).toISOString(); }
    catch { toast.error("Format waktu buka tidak valid"); return; }

    const closeTimeStr = get("closeTime");
    let closeTimeISO: string | null = null;
    if (closeTimeStr) {
      try { closeTimeISO = new Date(closeTimeStr).toISOString(); }
      catch { toast.error("Format waktu tutup tidak valid"); return; }
    }

    const data: Record<string, unknown> = {
      accountId,
      symbol: get("symbol").toUpperCase(),
      direction,
      status,
      entryMode,
      openTime: openTimeISO,
      openPrice: parseFloat(openPriceStr),
      closeTime: closeTimeISO,
      closePrice: getNum("closePrice"),
      stopLoss: getNum("stopLoss"),
      takeProfit: getNum("takeProfit"),
      riskPercent: getNum("riskPercent"),
      commission: parseFloat(get("commission")) || 0,
      setup: get("setup") || null,
      notes: get("notes") || null,
      tradeMarketType: isMultiAsset ? (tradeAssetType || null) : null,
      tagIds: trade?.tagIds ?? [],
    };

    // Market-specific fields
    if (isForexOrCommodity(effectiveMarketType)) {
      data.lotSize = getNum("lotSize");
      data.swap = parseFloat(get("swap")) || 0;
      if (entryMode === "MULTI_LAYER") {
        data.priceRangeHigh = getNum("priceRangeHigh");
        data.priceRangeLow = getNum("priceRangeLow");
        data.layerCount = parseInt(get("layerCount")) || null;
      }
    }
    if (isStock(effectiveMarketType)) {
      data.quantity = getNum("quantity");
      data.buyFee = parseFloat(get("buyFee")) || 0;
      data.sellFee = parseFloat(get("sellFee")) || 0;
      data.taxAmount = parseFloat(get("taxAmount")) || 0;
      data.dividend = parseFloat(get("dividend")) || 0;
    }
    if (isCryptoFutures(effectiveMarketType)) {
      data.leverage = getNum("leverage");
      data.marginMode = marginMode;
      data.fundingRate = getNum("fundingRate");
    }

    data.grossProfit = getNum("grossProfit");
    data.netProfit = getNum("netProfit");
    data.pips = getNum("pips");
    data.rMultiple = getNum("rMultiple");

    const url = mode === "edit" ? `/api/trades/${trade!.id}` : "/api/trades";
    const method = mode === "edit" ? "PATCH" : "POST";

    startTransition(async () => {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        toast.error(body.error ?? "Gagal menyimpan trade");
        return;
      }

      toast.success(mode === "edit" ? "Trade berhasil diperbarui" : "Trade berhasil disimpan");
      setOpen(false);
      router.refresh();
    });
  }

  const pnlTone =
    summary.netProfit === null
      ? "text-muted-foreground"
      : summary.netProfit > 0
      ? "text-profit"
      : summary.netProfit < 0
      ? "text-loss"
      : "text-foreground";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {mode === "create" && openProp === undefined && (
        <SheetTrigger render={<Button size="sm" className="gap-1.5" />}>
          <Plus className="size-3.5" />
          Trade Baru
        </SheetTrigger>
      )}

      {/* Bottom sheet on a phone, right-hand drawer from md up. */}
      <SheetContent side="responsive" className="gap-0 p-0 md:sm:max-w-lg">
        <form
          onSubmit={handleSubmit}
          onInput={(e) => recomputeSummary(e.currentTarget)}
          className="flex h-full min-h-0 flex-col"
        >
          {/* Drag affordance — reads as a sheet you can pull down, and only
              makes sense in the bottom position. */}
          <div className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-border md:hidden" />

          <SheetHeader className="shrink-0 border-b border-border px-4 py-3">
            <SheetTitle className="text-[13px] font-semibold tracking-wide uppercase">
              {mode === "edit" ? "Edit Trade" : "Catat Trade"}
            </SheetTitle>
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {/* ── Direction ──────────────────────────────────────────────
                The single most consequential choice on the ticket, so it gets
                the full-width green/red pair instead of a dropdown. */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={isLong ? "long" : "secondary"}
                className={cn("h-10 text-[13px]", !isLong && "text-muted-foreground")}
                onClick={() => setDirection("LONG")}
              >
                LONG / BUY
              </Button>
              <Button
                type="button"
                variant={!isLong ? "short" : "secondary"}
                className={cn("h-10 text-[13px]", isLong && "text-muted-foreground")}
                onClick={() => setDirection("SHORT")}
              >
                SHORT / SELL
              </Button>
            </div>

            {/* ── Always-visible essentials ──────────────────────────── */}
            <Field label="Akun">
              <Select
                value={accountId}
                onValueChange={(v) => {
                  if (v) {
                    setAccountId(v as string);
                    if (mode === "create") setTradeAssetType("");
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <span className="flex flex-1 text-left text-sm">
                    {selectedAccount ? (
                      `${selectedAccount.name} (${selectedAccount.currency})`
                    ) : (
                      <span className="text-muted-foreground">Pilih akun</span>
                    )}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} ({a.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {isMultiAsset && (
              <Field label="Tipe Aset">
                <Select
                  value={tradeAssetType}
                  onValueChange={(v) => v && setTradeAssetType(v as string)}
                >
                  <SelectTrigger className="w-full">
                    <span className="flex flex-1 text-left text-sm">
                      {tradeAssetType ? (
                        TRADE_ASSET_TYPES.find((t) => t.value === tradeAssetType)?.label
                      ) : (
                        <span className="text-muted-foreground">
                          Pilih tipe aset untuk trade ini
                        </span>
                      )}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {TRADE_ASSET_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Symbol" htmlFor="symbol">
                <Input
                  id="symbol"
                  name="symbol"
                  placeholder={suggestions[0] ?? "Mis: EURUSD"}
                  list="symbol-suggestions"
                  defaultValue={trade?.symbol ?? ""}
                  className="num font-semibold uppercase"
                  required
                />
                <datalist id="symbol-suggestions">
                  {suggestions.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </Field>

              {/* Two mutually exclusive states read faster as a segmented pair
                  than as a dropdown that must be opened to be read. */}
              <Field label="Status">
                <div className="flex h-8 items-center gap-1 rounded-md bg-secondary p-[3px]">
                  {(["OPEN", "CLOSED"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={cn(
                        "h-full flex-1 rounded-md text-[12px] font-medium transition-colors",
                        status === s
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {s === "OPEN" ? "Open" : "Closed"}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            {isMultiLayerSupported(effectiveMarketType) && (
              <Field label="Mode Entry">
                <Select value={entryMode} onValueChange={(v) => v && setEntryMode(v as string)}>
                  <SelectTrigger className="w-full">
                    <span className="flex flex-1 text-left text-sm">
                      {entryMode === "SINGLE" ? "Single Entry" : "Multi-Layer (Grid/Averaging)"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLE">Single Entry</SelectItem>
                    <SelectItem value="MULTI_LAYER">Multi-Layer (Grid/Averaging)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Harga Buka" htmlFor="openPrice">
                <Input
                  id="openPrice"
                  name="openPrice"
                  type="number"
                  step="any"
                  className="num"
                  defaultValue={numStr(trade?.openPrice)}
                  required
                />
              </Field>
              <Field label="Harga Tutup" htmlFor="closePrice">
                <Input
                  id="closePrice"
                  name="closePrice"
                  type="number"
                  step="any"
                  className="num"
                  defaultValue={numStr(trade?.closePrice)}
                />
              </Field>
              <Field label="Waktu Buka" htmlFor="openTime">
                <Input
                  id="openTime"
                  name="openTime"
                  type="datetime-local"
                  defaultValue={toDatetimeLocal(trade?.openTime)}
                  required
                />
              </Field>
              <Field label="Waktu Tutup" htmlFor="closeTime">
                <Input
                  id="closeTime"
                  name="closeTime"
                  type="datetime-local"
                  defaultValue={toDatetimeLocal(trade?.closeTime)}
                />
              </Field>
            </div>

            {/* ── Everything else, grouped ───────────────────────────────
                keepMounted matters: hidden panels still contribute their
                inputs to form.elements on submit. */}
            <Tabs defaultValue="market" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="market" className="flex-1">Market</TabsTrigger>
                <TabsTrigger value="pnl" className="flex-1">P&amp;L</TabsTrigger>
                <TabsTrigger value="risk" className="flex-1">Risk</TabsTrigger>
                <TabsTrigger value="notes" className="flex-1">Catatan</TabsTrigger>
              </TabsList>

              <TabsContent value="market" keepMounted className="mt-3">
                <MarketFields
                  marketType={effectiveMarketType}
                  isMultiAsset={isMultiAsset}
                  entryMode={entryMode}
                  marginMode={marginMode}
                  onMarginModeChange={setMarginMode}
                  trade={trade}
                />
              </TabsContent>

              <TabsContent value="pnl" keepMounted className="mt-3">
                <PnlFields
                  marketType={effectiveMarketType}
                  entryMode={entryMode}
                  trade={trade}
                />
              </TabsContent>

              <TabsContent value="risk" keepMounted className="mt-3">
                <RiskFields trade={trade} />
              </TabsContent>

              <TabsContent value="notes" keepMounted className="mt-3">
                <NotesFields trade={trade} />
              </TabsContent>
            </Tabs>
          </div>

          {/* ── Sticky summary + actions ───────────────────────────────
              Mirrors an exchange order form: the consequence of what you typed
              stays visible while you type it. */}
          <div className="shrink-0 border-t border-border bg-card">
            <div className="grid grid-cols-3 gap-2 px-4 py-2.5">
              <div>
                <p className="text-[10px] tracking-wide text-muted-foreground uppercase">
                  Net P&amp;L
                </p>
                <p className={cn("num text-[15px] font-semibold", pnlTone)}>
                  {summary.netProfit === null
                    ? "–"
                    : `${summary.netProfit >= 0 ? "+" : "−"}${Math.abs(summary.netProfit).toLocaleString("en-US", { maximumFractionDigits: 2 })}`}
                </p>
              </div>
              <div>
                <p className="text-[10px] tracking-wide text-muted-foreground uppercase">
                  R-Multiple
                </p>
                <p className="num text-[15px] font-semibold">
                  {summary.rMultiple === null ? "–" : `${summary.rMultiple.toFixed(2)}R`}
                </p>
              </div>
              <div>
                <p className="text-[10px] tracking-wide text-muted-foreground uppercase">
                  Durasi
                </p>
                <p className="num text-[15px] font-semibold">{summary.duration ?? "–"}</p>
              </div>
            </div>

            {/* Bottom padding clears the home indicator — the sheet's lower
                edge sits on the screen edge on a phone. Taller buttons on
                touch: the 32px default is below the 44px target minimum. */}
            <div className="flex gap-2 border-t border-border px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:pb-3">
              <Button
                type="button"
                variant="secondary"
                className="h-11 flex-1 md:h-8"
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isPending} className="h-11 flex-2 md:h-8">
                {isPending
                  ? "Menyimpan..."
                  : mode === "edit"
                  ? "Simpan Perubahan"
                  : "Simpan Trade"}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function NewTradeTicket({ accounts }: { accounts: Account[] }) {
  return <TradeTicket accounts={accounts} mode="create" />;
}
