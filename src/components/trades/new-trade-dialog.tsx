"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface Account {
  id: string;
  name: string;
  marketType: string;
  currency: string;
}

interface NewTradeDialogProps {
  accounts: Account[];
}

const FOREX_SYMBOLS = ["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD"];
const COMMODITY_SYMBOLS = ["XAUUSD", "XAGUSD", "USOIL", "UKOIL"];
const CRYPTO_SYMBOLS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT"];

const TRADE_ASSET_TYPES = [
  { value: "FOREX",          label: "Forex" },
  { value: "COMMODITY",      label: "Komoditas (XAU/XAG)" },
  { value: "STOCK_IDX",      label: "Saham IDX" },
  { value: "STOCK_US",       label: "Saham US" },
  { value: "CRYPTO_SPOT",    label: "Crypto Spot" },
  { value: "CRYPTO_FUTURES", label: "Crypto Futures" },
];

function getSymbolSuggestions(mt: string) {
  if (mt === "FOREX") return FOREX_SYMBOLS;
  if (mt === "COMMODITY") return COMMODITY_SYMBOLS;
  if (mt === "CRYPTO_SPOT" || mt === "CRYPTO_FUTURES") return CRYPTO_SYMBOLS;
  return [];
}

function isForexOrCommodity(mt: string) {
  return mt === "FOREX" || mt === "COMMODITY";
}
function isStock(mt: string) {
  return mt === "STOCK_IDX" || mt === "STOCK_US";
}
function isCryptoFutures(mt: string) {
  return mt === "CRYPTO_FUTURES";
}
function isMultiLayerSupported(mt: string) {
  return mt === "FOREX" || mt === "COMMODITY";
}

export function NewTradeDialog({ accounts }: NewTradeDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [direction, setDirection] = useState("LONG");
  const [status, setStatus] = useState("CLOSED");
  const [entryMode, setEntryMode] = useState("SINGLE");
  const [marginMode, setMarginMode] = useState("ISOLATED");
  const [tradeAssetType, setTradeAssetType] = useState("");

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const accountMarketType = selectedAccount?.marketType ?? "";
  const isMultiAsset = accountMarketType === "MULTI_ASSET";
  const effectiveMarketType = isMultiAsset ? tradeAssetType : accountMarketType;

  const suggestions = getSymbolSuggestions(effectiveMarketType);

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

    startTransition(async () => {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        toast.error(body.error ?? "Gagal menyimpan trade");
        return;
      }

      toast.success("Trade berhasil disimpan");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-2" />}>
        <Plus className="h-4 w-4" />
        Trade Baru
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Catat Trade Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Account */}
          <div className="space-y-2">
            <Label>Akun *</Label>
            <Select value={accountId} onValueChange={(v) => { if (v) { setAccountId(v); setTradeAssetType(""); } }}>
              <SelectTrigger>
                <span className="flex flex-1 text-left text-sm">
                  {selectedAccount
                    ? `${selectedAccount.name} (${selectedAccount.currency})`
                    : <span className="text-muted-foreground">Pilih akun</span>
                  }
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
          </div>

          {/* Tipe Aset — hanya untuk akun Multi Asset */}
          {isMultiAsset && (
            <div className="space-y-2">
              <Label>Tipe Aset *</Label>
              <Select value={tradeAssetType} onValueChange={(v) => v && setTradeAssetType(v)}>
                <SelectTrigger>
                  <span className="flex flex-1 text-left text-sm">
                    {tradeAssetType
                      ? TRADE_ASSET_TYPES.find((t) => t.value === tradeAssetType)?.label
                      : <span className="text-muted-foreground">Pilih tipe aset untuk trade ini</span>
                    }
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
            </div>
          )}

          {/* Symbol + Direction */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol *</Label>
              <Input
                id="symbol"
                name="symbol"
                placeholder={suggestions[0] ?? "Mis: EURUSD"}
                list="symbol-suggestions"
                required
              />
              <datalist id="symbol-suggestions">
                {suggestions.map((s) => <option key={s} value={s} />)}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label>Arah *</Label>
              <Select value={direction} onValueChange={(v) => v && setDirection(v)}>
                <SelectTrigger>
                  <span className="flex flex-1 text-left text-sm">{direction === "LONG" ? "Long / Buy" : "Short / Sell"}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LONG">Long / Buy</SelectItem>
                  <SelectItem value="SHORT">Short / Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Entry mode (forex/commodity only) */}
          {isMultiLayerSupported(effectiveMarketType) && (
            <div className="space-y-2">
              <Label>Mode Entry</Label>
              <Select value={entryMode} onValueChange={(v) => v && setEntryMode(v)}>
                <SelectTrigger>
                  <span className="flex flex-1 text-left text-sm">
                    {entryMode === "SINGLE" ? "Single Entry" : "Multi-Layer (Grid/Averaging)"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE">Single Entry</SelectItem>
                  <SelectItem value="MULTI_LAYER">Multi-Layer (Grid/Averaging)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => v && setStatus(v)}>
              <SelectTrigger>
                <span className="flex flex-1 text-left text-sm">{status === "OPEN" ? "Open" : "Closed"}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Timing */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="openTime">Waktu Buka *</Label>
              <Input id="openTime" name="openTime" type="datetime-local" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closeTime">Waktu Tutup</Label>
              <Input id="closeTime" name="closeTime" type="datetime-local" />
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="openPrice">Harga Buka *</Label>
              <Input id="openPrice" name="openPrice" type="number" step="any" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closePrice">Harga Tutup</Label>
              <Input id="closePrice" name="closePrice" type="number" step="any" />
            </div>
          </div>

          <Tabs defaultValue="market" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="market" className="flex-1">Market</TabsTrigger>
              <TabsTrigger value="pnl" className="flex-1">P&amp;L</TabsTrigger>
              <TabsTrigger value="risk" className="flex-1">Risk</TabsTrigger>
              <TabsTrigger value="notes" className="flex-1">Catatan</TabsTrigger>
            </TabsList>

            {/* Market-specific tab */}
            <TabsContent value="market" className="space-y-3 mt-3">
              {isForexOrCommodity(effectiveMarketType) && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="lotSize">Lot Size</Label>
                      <Input id="lotSize" name="lotSize" type="number" step="0.01" placeholder="0.01" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="swap">Swap</Label>
                      <Input id="swap" name="swap" type="number" step="0.01" placeholder="0" />
                    </div>
                  </div>
                  {entryMode === "MULTI_LAYER" && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="priceRangeHigh">Harga Tertinggi</Label>
                        <Input id="priceRangeHigh" name="priceRangeHigh" type="number" step="any" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="priceRangeLow">Harga Terendah</Label>
                        <Input id="priceRangeLow" name="priceRangeLow" type="number" step="any" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="layerCount">Jumlah Layer</Label>
                        <Input id="layerCount" name="layerCount" type="number" min="1" />
                      </div>
                    </div>
                  )}
                </>
              )}

              {isStock(effectiveMarketType) && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Jumlah Saham/Lot</Label>
                    <Input id="quantity" name="quantity" type="number" step="1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="buyFee">Biaya Beli</Label>
                      <Input id="buyFee" name="buyFee" type="number" step="0.01" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sellFee">Biaya Jual</Label>
                      <Input id="sellFee" name="sellFee" type="number" step="0.01" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxAmount">Pajak</Label>
                      <Input id="taxAmount" name="taxAmount" type="number" step="0.01" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dividend">Dividen</Label>
                      <Input id="dividend" name="dividend" type="number" step="0.01" placeholder="0" />
                    </div>
                  </div>
                </>
              )}

              {isCryptoFutures(effectiveMarketType) && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="leverage">Leverage</Label>
                    <Input id="leverage" name="leverage" type="number" step="1" placeholder="10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Margin Mode</Label>
                    <Select value={marginMode} onValueChange={(v) => v && setMarginMode(v)}>
                      <SelectTrigger>
                        <span className="flex flex-1 text-left text-sm">{marginMode}</span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ISOLATED">Isolated</SelectItem>
                        <SelectItem value="CROSS">Cross</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="fundingRate">Funding Rate</Label>
                    <Input id="fundingRate" name="fundingRate" type="number" step="0.0001" />
                  </div>
                </div>
              )}

              {!isForexOrCommodity(effectiveMarketType) && !isStock(effectiveMarketType) && !isCryptoFutures(effectiveMarketType) && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {isMultiAsset
                    ? "Pilih tipe aset di atas untuk melihat field spesifik"
                    : "Pilih akun terlebih dahulu untuk melihat field spesifik market"
                  }
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="commission">Komisi</Label>
                <Input id="commission" name="commission" type="number" step="0.01" placeholder="0" />
              </div>
            </TabsContent>

            {/* P&L tab */}
            <TabsContent value="pnl" className="space-y-3 mt-3">
              {entryMode === "MULTI_LAYER" && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-md p-3">
                  Mode Multi-Layer: masukkan P&L langsung dari broker (tidak dikalkulasi otomatis)
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="grossProfit">Gross Profit</Label>
                  <Input id="grossProfit" name="grossProfit" type="number" step="0.01" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="netProfit">Net Profit</Label>
                  <Input id="netProfit" name="netProfit" type="number" step="0.01" />
                </div>
                {isForexOrCommodity(effectiveMarketType) && (
                  <div className="space-y-2">
                    <Label htmlFor="pips">Pips</Label>
                    <Input id="pips" name="pips" type="number" step="0.1" />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="rMultiple">R-Multiple</Label>
                  <Input id="rMultiple" name="rMultiple" type="number" step="0.01" placeholder="2.5" />
                </div>
              </div>
            </TabsContent>

            {/* Risk tab */}
            <TabsContent value="risk" className="space-y-3 mt-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="stopLoss">Stop Loss</Label>
                  <Input id="stopLoss" name="stopLoss" type="number" step="any" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="takeProfit">Take Profit</Label>
                  <Input id="takeProfit" name="takeProfit" type="number" step="any" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="riskPercent">Risk %</Label>
                  <Input id="riskPercent" name="riskPercent" type="number" step="0.1" placeholder="1" />
                </div>
              </div>
            </TabsContent>

            {/* Notes tab */}
            <TabsContent value="notes" className="space-y-3 mt-3">
              <div className="space-y-2">
                <Label htmlFor="setup">Setup / Strategi</Label>
                <Input id="setup" name="setup" placeholder="Mis: Breakout M30, Trend Following" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Catatan</Label>
                <Textarea id="notes" name="notes" rows={4} placeholder="Analisis, pelajaran, dll..." />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan Trade"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
