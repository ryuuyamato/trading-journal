"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "NZD", "CAD", "CHF", "CNY"];
const IMPACTS = ["HIGH", "MEDIUM", "LOW", "HOLIDAY"];

interface CalendarFiltersProps {
  defaultFrom: string;
  defaultTo: string;
}

export function CalendarFilters({ defaultFrom, defaultTo }: CalendarFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const currency = searchParams.get("currency");
  const impact = searchParams.get("impact");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  function toggleImpact(val: string) {
    const current = impact ? impact.split(",") : [];
    const next = current.includes(val)
      ? current.filter((i) => i !== val)
      : [...current, val];
    setParam("impact", next.length > 0 ? next.join(",") : null);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      {/* Date range */}
      <div className="flex items-center gap-1">
        <label className="text-[11px] text-muted-foreground">Dari</label>
        <input
          type="date"
          value={from ?? defaultFrom}
          onChange={(e) => setParam("from", e.target.value || null)}
          className="text-[12px] px-2 py-1 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <div className="flex items-center gap-1">
        <label className="text-[11px] text-muted-foreground">Sampai</label>
        <input
          type="date"
          value={to ?? defaultTo}
          onChange={(e) => setParam("to", e.target.value || null)}
          className="text-[12px] px-2 py-1 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Separator */}
      <span className="text-border">|</span>

      {/* Currency filter */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-[11px] text-muted-foreground">Mata uang:</span>
        {CURRENCIES.map((c) => (
          <button
            key={c}
            onClick={() => setParam("currency", currency === c ? null : c)}
            className={`px-2 py-0.5 text-[11px] rounded border transition-colors ${
              currency === c
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Separator */}
      <span className="text-border">|</span>

      {/* Impact filter */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-[11px] text-muted-foreground">Dampak:</span>
        {IMPACTS.map((imp) => {
          const active = impact ? impact.split(",").includes(imp) : false;
          return (
            <button
              key={imp}
              onClick={() => toggleImpact(imp)}
              className={`flex items-center gap-1 px-2 py-0.5 text-[11px] rounded border transition-colors ${
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${IMPACT_DOT_CLASS[imp]}`} />
              {IMPACT_LABEL[imp]}
            </button>
          );
        })}
      </div>

      {(currency || impact || from || to) && (
        <>
          <span className="text-border">|</span>
          <button
            onClick={() => {
              const params = new URLSearchParams();
              router.push(pathname + (params.toString() ? "?" + params : ""));
            }}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Reset filter
          </button>
        </>
      )}
    </div>
  );
}

const IMPACT_DOT_CLASS: Record<string, string> = {
  HIGH: "bg-red-500",
  MEDIUM: "bg-amber-400",
  LOW: "bg-green-500",
  HOLIDAY: "bg-blue-400",
};

const IMPACT_LABEL: Record<string, string> = {
  HIGH: "Tinggi",
  MEDIUM: "Sedang",
  LOW: "Rendah",
  HOLIDAY: "Libur",
};
