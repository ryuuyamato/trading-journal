"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/trades/ticket-fields/field";
import { TagPicker } from "@/components/trades/ticket-fields/tag-picker";
import { EmotionScale } from "@/components/trades/ticket-fields/emotion-scale";
import type { TradeDraft } from "@/components/trades/trade-ticket";

interface NotesFieldsProps {
  trade?: TradeDraft;
  tagIds: string[];
  onTagIdsChange: (tagIds: string[]) => void;
  emotionBefore: number | null;
  onEmotionBeforeChange: (value: number | null) => void;
  emotionAfter: number | null;
  onEmotionAfterChange: (value: number | null) => void;
}

export function NotesFields({
  trade,
  tagIds,
  onTagIdsChange,
  emotionBefore,
  onEmotionBeforeChange,
  emotionAfter,
  onEmotionAfterChange,
}: NotesFieldsProps) {
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

      <Field label="Tag">
        <TagPicker value={tagIds} onChange={onTagIdsChange} />
      </Field>

      <Field label="Perasaan sebelum entry">
        <EmotionScale
          value={emotionBefore}
          onChange={onEmotionBeforeChange}
          ariaLabel="Perasaan sebelum entry"
        />
      </Field>

      <Field label="Perasaan setelah keluar">
        <EmotionScale
          value={emotionAfter}
          onChange={onEmotionAfterChange}
          ariaLabel="Perasaan setelah keluar"
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
