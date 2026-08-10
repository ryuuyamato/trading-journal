"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Field } from "@/components/trades/ticket-fields/field";
import type { TradeDraft } from "@/components/trades/trade-ticket";
import {
  isCryptoFutures,
  isForexOrCommodity,
  isStock,
  numStr,
} from "@/lib/trade-form";

interface MarketFieldsProps {
  marketType: string;
  isMultiAsset: boolean;
  entryMode: string;
  marginMode: string;
  onMarginModeChange: (v: string) => void;
  trade?: TradeDraft;
}

export function MarketFields({
  marketType,
  isMultiAsset,
  entryMode,
  marginMode,
  onMarginModeChange,
  trade,
}: MarketFieldsProps) {
  const knownMarket =
    isForexOrCommodity(marketType) || isStock(marketType) || isCryptoFutures(marketType);

  return (
    <div className="space-y-3">
      {isForexOrCommodity(marketType) && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Lot Size" htmlFor="lotSize">
              <Input
                id="lotSize"
                name="lotSize"
                type="number"
                step="0.01"
                placeholder="0.01"
                defaultValue={numStr(trade?.lotSize)}
              />
            </Field>
            <Field label="Swap" htmlFor="swap">
              <Input
                id="swap"
                name="swap"
                type="number"
                step="0.01"
                placeholder="0"
                defaultValue={numStr(trade?.swap)}
              />
            </Field>
          </div>

          {entryMode === "MULTI_LAYER" && (
            <div className="grid grid-cols-3 gap-3">
              <Field label="Harga Tertinggi" htmlFor="priceRangeHigh">
                <Input
                  id="priceRangeHigh"
                  name="priceRangeHigh"
                  type="number"
                  step="any"
                  defaultValue={numStr(trade?.priceRangeHigh)}
                />
              </Field>
              <Field label="Harga Terendah" htmlFor="priceRangeLow">
                <Input
                  id="priceRangeLow"
                  name="priceRangeLow"
                  type="number"
                  step="any"
                  defaultValue={numStr(trade?.priceRangeLow)}
                />
              </Field>
              <Field label="Jumlah Layer" htmlFor="layerCount">
                <Input
                  id="layerCount"
                  name="layerCount"
                  type="number"
                  min="1"
                  defaultValue={numStr(trade?.layerCount)}
                />
              </Field>
            </div>
          )}
        </>
      )}

      {isStock(marketType) && (
        <>
          <Field label="Jumlah Saham/Lot" htmlFor="quantity">
            <Input
              id="quantity"
              name="quantity"
              type="number"
              step="1"
              defaultValue={numStr(trade?.quantity)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Biaya Beli" htmlFor="buyFee">
              <Input
                id="buyFee"
                name="buyFee"
                type="number"
                step="0.01"
                placeholder="0"
                defaultValue={numStr(trade?.buyFee)}
              />
            </Field>
            <Field label="Biaya Jual" htmlFor="sellFee">
              <Input
                id="sellFee"
                name="sellFee"
                type="number"
                step="0.01"
                placeholder="0"
                defaultValue={numStr(trade?.sellFee)}
              />
            </Field>
            <Field label="Pajak" htmlFor="taxAmount">
              <Input
                id="taxAmount"
                name="taxAmount"
                type="number"
                step="0.01"
                placeholder="0"
                defaultValue={numStr(trade?.taxAmount)}
              />
            </Field>
            <Field label="Dividen" htmlFor="dividend">
              <Input
                id="dividend"
                name="dividend"
                type="number"
                step="0.01"
                placeholder="0"
                defaultValue={numStr(trade?.dividend)}
              />
            </Field>
          </div>
        </>
      )}

      {isCryptoFutures(marketType) && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Leverage" htmlFor="leverage">
            <Input
              id="leverage"
              name="leverage"
              type="number"
              step="1"
              placeholder="10"
              defaultValue={numStr(trade?.leverage)}
            />
          </Field>
          <Field label="Margin Mode">
            <Select value={marginMode} onValueChange={(v) => v && onMarginModeChange(v as string)}>
              <SelectTrigger className="w-full">
                <span className="flex flex-1 text-left text-sm">
                  {marginMode === "ISOLATED" ? "Isolated" : "Cross"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ISOLATED">Isolated</SelectItem>
                <SelectItem value="CROSS">Cross</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Funding Rate" htmlFor="fundingRate" className="col-span-2">
            <Input
              id="fundingRate"
              name="fundingRate"
              type="number"
              step="0.0001"
              defaultValue={numStr(trade?.fundingRate)}
            />
          </Field>
        </div>
      )}

      {!knownMarket && (
        <p className="rounded border border-dashed border-border py-6 text-center text-[12px] text-muted-foreground">
          {isMultiAsset
            ? "Pilih tipe aset di atas untuk melihat field spesifik"
            : "Pilih akun terlebih dahulu untuk melihat field spesifik market"}
        </p>
      )}

      <Field label="Komisi" htmlFor="commission">
        <Input
          id="commission"
          name="commission"
          type="number"
          step="0.01"
          placeholder="0"
          defaultValue={numStr(trade?.commission)}
        />
      </Field>
    </div>
  );
}
