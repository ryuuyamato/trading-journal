"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/trades/ticket-fields/field";
import type { TradeFormValues } from "@/components/trades/trade-ticket";

export function NotesFields({ trade }: { trade?: TradeFormValues }) {
  return (
    <div className="space-y-3">
      <Field label="Setup / Strategi" htmlFor="setup">
        <Input
          id="setup"
          name="setup"
          placeholder="Mis: Breakout M30, Trend Following"
          defaultValue={trade?.setup ?? ""}
        />
      </Field>
      <Field label="Catatan" htmlFor="notes">
        <Textarea
          id="notes"
          name="notes"
          rows={5}
          placeholder="Analisis, pelajaran, dll..."
          defaultValue={trade?.notes ?? ""}
        />
      </Field>
    </div>
  );
}
