"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TradeListItem } from "@/components/trades/types";

const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function dateKey(d: Date) {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

function formatPnlShort(v: number, currency: string) {
  const prefix = v >= 0 ? "+" : "-";
  const abs = Math.abs(v);
  if (currency === "IDR") {
    return `${prefix}Rp${abs >= 1_000_000 ? `${(abs / 1_000_000).toFixed(1)}jt` : abs.toLocaleString("id-ID")}`;
  }
  return `${prefix}$${abs >= 1000 ? `${(abs / 1000).toFixed(1)}k` : abs.toFixed(0)}`;
}

export function TradesCalendar({ trades }: { trades: TradeListItem[] }) {
  const router = useRouter();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const byDay = useMemo(() => {
    const map = new Map<string, TradeListItem[]>();
    for (const t of trades) {
      const key = dateKey(new Date(t.openTime));
      const list = map.get(key) ?? [];
      list.push(t);
      map.set(key, list);
    }
    return map;
  }, [trades]);

  const { year, month } = cursor;
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = dateKey(new Date());

  const cells: { date: Date | null }[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ date: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(year, month, d) });
  while (cells.length % 7 !== 0) cells.push({ date: null });

  function goMonth(delta: number) {
    setCursor((c) => {
      const m = c.month + delta;
      if (m < 0) return { year: c.year - 1, month: 11 };
      if (m > 11) return { year: c.year + 1, month: 0 };
      return { year: c.year, month: m };
    });
  }

  return (
    <div className="py-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[14px] font-medium">{MONTH_NAMES[month]} {year}</h2>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => goMonth(-1)} aria-label="Bulan sebelumnya">
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[12px]"
            onClick={() => setCursor({ year: new Date().getFullYear(), month: new Date().getMonth() })}
          >
            Hari ini
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => goMonth(1)} aria-label="Bulan berikutnya">
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-[11px] text-muted-foreground font-medium py-1">
            {w}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell.date) return <div key={i} className="rounded-lg min-h-20 bg-transparent" />;

          const key = dateKey(cell.date);
          const dayTrades = byDay.get(key) ?? [];
          const dayPnl = dayTrades.reduce((sum, t) => sum + (t.netProfit ?? 0), 0);
          const hasClosed = dayTrades.some((t) => t.netProfit !== null);
          const isToday = key === todayKey;
          const currency = dayTrades[0]?.account.currency ?? "USD";

          return (
            <div
              key={i}
              className={`rounded-lg min-h-20 border p-1.5 flex flex-col gap-1 ${
                isToday ? "border-foreground/40 bg-secondary/40" : "border-border"
              }`}
            >
              <span className={`text-[11px] ${isToday ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                {cell.date.getDate()}
              </span>
              {dayTrades.length > 0 && (
                <button
                  onClick={() => {
                    if (dayTrades.length === 1) router.push(`/trades/${dayTrades[0].id}`);
                  }}
                  className="flex-1 flex flex-col items-start gap-0.5 text-left"
                >
                  {hasClosed && (
                    <span
                      className="text-[11px] font-medium px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: dayPnl > 0 ? "var(--color-profit)" : dayPnl < 0 ? "var(--color-loss)" : "var(--color-muted)",
                        color: dayPnl !== 0 ? "white" : "var(--color-muted-foreground)",
                        opacity: dayPnl !== 0 ? 0.9 : 1,
                      }}
                    >
                      {formatPnlShort(dayPnl, currency)}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {dayTrades.length} trade{dayTrades.length > 1 ? "" : ""}
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
