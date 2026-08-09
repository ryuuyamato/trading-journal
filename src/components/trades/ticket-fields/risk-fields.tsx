"use client";

import { Input } from "@/components/ui/input";
import { Field } from "@/components/trades/ticket-fields/field";
import type { TradeFormValues } from "@/components/trades/trade-ticket";
import { numStr } from "@/lib/trade-form";

export function RiskFields({ trade }: { trade?: TradeFormValues }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Field label="Stop Loss" htmlFor="stopLoss">
        <Input
          id="stopLoss"
          name="stopLoss"
          type="number"
          step="any"
          className="num"
          defaultValue={numStr(trade?.stopLoss)}
        />
      </Field>
      <Field label="Take Profit" htmlFor="takeProfit">
        <Input
          id="takeProfit"
          name="takeProfit"
          type="number"
          step="any"
          className="num"
          defaultValue={numStr(trade?.takeProfit)}
        />
      </Field>
      <Field label="Risk %" htmlFor="riskPercent">
        <Input
          id="riskPercent"
          name="riskPercent"
          type="number"
          step="0.1"
          placeholder="1"
          className="num"
          defaultValue={numStr(trade?.riskPercent)}
        />
      </Field>
    </div>
  );
}
