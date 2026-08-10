"use client";

import { Input } from "@/components/ui/input";
import { Field } from "@/components/trades/ticket-fields/field";
import type { TradeDraft } from "@/components/trades/trade-ticket";
import { isForexOrCommodity, numStr } from "@/lib/trade-form";

export function PnlFields({
  marketType,
  entryMode,
  trade,
}: {
  marketType: string;
  entryMode: string;
  trade?: TradeDraft;
}) {
  return (
    <div className="space-y-3">
      {entryMode === "MULTI_LAYER" && (
        <p className="rounded border-l-2 border-primary bg-primary/5 px-3 py-2 text-[11.5px] text-muted-foreground">
          Mode Multi-Layer: masukkan P&amp;L langsung dari broker (tidak dikalkulasi otomatis)
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Gross Profit" htmlFor="grossProfit">
          <Input
            id="grossProfit"
            name="grossProfit"
            type="number"
            step="0.01"
            className="num"
            defaultValue={numStr(trade?.grossProfit)}
          />
        </Field>
        <Field label="Net Profit" htmlFor="netProfit">
          <Input
            id="netProfit"
            name="netProfit"
            type="number"
            step="0.01"
            className="num"
            defaultValue={numStr(trade?.netProfit)}
          />
        </Field>
        {isForexOrCommodity(marketType) && (
          <Field label="Pips" htmlFor="pips">
            <Input
              id="pips"
              name="pips"
              type="number"
              step="0.1"
              className="num"
              defaultValue={numStr(trade?.pips)}
            />
          </Field>
        )}
        <Field label="R-Multiple" htmlFor="rMultiple">
          <Input
            id="rMultiple"
            name="rMultiple"
            type="number"
            step="0.01"
            placeholder="2.5"
            className="num"
            defaultValue={numStr(trade?.rMultiple)}
          />
        </Field>
      </div>
    </div>
  );
}
