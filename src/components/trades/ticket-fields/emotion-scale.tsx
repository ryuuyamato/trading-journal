"use client";

import { cn } from "@/lib/utils";

// Label mengalahkan angka telanjang: "3" tidak berarti apa-apa saat direview
// tiga bulan kemudian, "Netral" berarti sesuatu.
const LEVELS = [
  { value: 1, label: "Buruk" },
  { value: 2, label: "Ragu" },
  { value: 3, label: "Netral" },
  { value: 4, label: "Yakin" },
  { value: 5, label: "Sangat yakin" },
];

interface EmotionScaleProps {
  value: number | null;
  onChange: (value: number | null) => void;
  ariaLabel: string;
}

export function EmotionScale({ value, onChange, ariaLabel }: EmotionScaleProps) {
  return (
    <div className="flex gap-1" role="group" aria-label={ariaLabel}>
      {LEVELS.map((level) => {
        const active = value === level.value;
        return (
          <button
            key={level.value}
            type="button"
            // Menekan pilihan yang sama membatalkannya — mengisi emosi itu
            // opsional, jadi harus ada jalan kembali ke kosong.
            onClick={() => onChange(active ? null : level.value)}
            aria-pressed={active}
            title={level.label}
            className={cn(
              "min-h-9 flex-1 rounded-md border text-[11px] transition-colors md:min-h-8",
              active
                ? "border-primary bg-primary/15 text-foreground"
                : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            {level.label}
          </button>
        );
      })}
    </div>
  );
}
