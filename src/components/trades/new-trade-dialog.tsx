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
  SelectValue,
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

function getSymbolSuggestions(marketType: string) {
  if (marketType === "FOREX") return FOREX_SYMBOLS;
  if (marketType === "COMMODITY") return COMMODITY_SYMBOLS;
  if (marketType === "CRYPTO_SPOT" || marketType === "CRYPTO_FUTURES") return CRYPTO_SYMBOLS;
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

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const marketType = selectedAccount?.marketType ?? "";

  const suggestions = getSymbolSuggestions(marketType);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement)?.value ?? "";
    const getNum = (name: string) => {
      const v = parseFloat(get(name));
      return isNaN(v) ? null : v;
    };

    const data: Record<string, unknown> = {
      accountId,
      symbol: get("symbol").toUpperCase(),
      direction,
      status,
      entryMode,
      openTime: new Date(get("openTime")).toISOString(),
      openPrice: parseFloat(get("openPrice")),
      closeTime: get("closeTime") ? new Date(get("closeTime")).toISOString() : null,
      closePrice: getNum("closePrice"),
      stopLoss: getNum("stopLoss"),
      takeProfit: getNum("takeProfit"),
      riskPercent: getNum("riskPercent"),
      commission: parseFloat(get("commission")) || 0,
      setup: get("setup") || null,
      notes: get("notes") || null,
    };

    // Market-specific fields
    if (isForexOrCommodity(marketType)) {
      data.lotSize = getNum("lotSize");
      data.swap = parseFloat(get("swap")) || 0;
      if (entryMode === "MULTI_LAYER") {
        data.priceRangeHigh = getNum("priceRangeHigh");
        data.priceRangeLow = getNum("priceRangeLow");
        data.layerCount = parseInt(get("layerCount")) || null;
      }
    }
    if (isStock(marketType)) {
      data.quantity = getNum("quantity");
      data.buyFee = parseFloat(get("buyFee")) || 0;
      data.sellFee = parseFloat(get("sellFee")) || 0;
      data.taxAmount = parseFloat(get("taxAmount")) || 0;
      data.dividend = parseFloat(get("dividend")) || 0;
    }
    if (isCryptoFutures(marketType)) {
      data.leverage = getNum("leverage");
      data.marginMode = marginMode;
      data.fundingRate = getNum("fundingRate");
    }

    // P&L — for multi-layer forex/commodity, entered manually from broker
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
          {/* Account + Symbol + Direction */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2 col-span-2">
              <Label>Akun *</Label>
              <Select value={accountId} onValueChange={(v) => v && setAccountId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih akun" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id} label={`${a.name} (${a.currency})`}>
                      {a.name} ({a.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LONG">Long / Buy</SelectItem>
                  <SelectItem value="SHORT">Short / Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Entry mode (forex/commodity only) */}
          {isMultiLayerSupported(marketType) && (
            <div className="space-y-2">
              <Label>Mode Entry</Label>
              <Select value={entryMode} onValueChange={(v) => v && setEntryMode(v)}>
                <SelectTrigger>
                  <SelectValue />
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
              <SelectTrigger><SelectValue /></SelectTrigger>
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
              {isForexOrCommodity(marketType) && (
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

              {isStock(marketType) && (
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

              {isCryptoFutures(marketType) && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="leverage">Leverage</Label>
                    <Input id="leverage" name="leverage" type="number" step="1" placeholder="10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Margin Mode</Label>
                    <Select value={marginMode} onValueChange={(v) => v && setMarginMode(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
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

              {!isForexOrCommodity(marketType) && !isStock(marketType) && !isCryptoFutures(marketType) && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Pilih akun terlebih dahulu untuk melihat field spesifik market
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
                {isForexOrCommodity(marketType) && (
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
