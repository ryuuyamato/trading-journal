"use client";

import { EventRow } from "./EventRow";

interface Analysis {
  id: string;
  summary: string;
  bias: string;
  instruments: string[];
}

interface Event {
  id: string;
  externalId: string;
  title: string;
  country: string;
  impact: string;
  eventTime: string;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
  analysis: Analysis | null;
}

interface Props {
  events: Event[];
  rawCount?: number;
}

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export function CalendarView({ events, rawCount }: Props) {
  if (events.length === 0) {
    return (
      <div className="py-16 text-center text-[13px] text-muted-foreground border border-border rounded-xl space-y-1">
        <p>Tidak ada event ekonomi dalam rentang ini.</p>
        {rawCount !== undefined && rawCount === 0 && (
          <p className="text-[12px]">
            Feed ForexFactory juga kosong — cek{" "}
            <span className="font-mono">/api/calendar/test</span> untuk diagnosis.
          </p>
        )}
        {rawCount !== undefined && rawCount > 0 && (
          <p className="text-[12px]">
            {rawCount} event ditemukan dari FF, tapi semuanya terfilter. Coba reset filter.
          </p>
        )}
      </div>
    );
  }

  // Group events by date in WIB (Asia/Jakarta = UTC+7)
  const grouped = new Map<string, Event[]>();
  for (const event of events) {
    const key = toJakartaDateKey(event.eventTime);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(event);
  }

  const sortedDates = Array.from(grouped.keys()).sort();

  return (
    <div className="space-y-4">
      {sortedDates.map((dateKey) => {
        const dayEvents = grouped.get(dateKey)!;
        // Parse date parts from YYYY-MM-DD key
        const [year, month, day] = dateKey.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        const dayName = DAY_NAMES[date.getDay()];
        const monthName = MONTH_NAMES[date.getMonth()];
        const dayNum = day;
        const isToday = dateKey === todayKey();
        const highCount = dayEvents.filter((e) => e.impact === "HIGH").length;

        return (
          <div key={dateKey} className="rounded-xl border border-border overflow-hidden">
            {/* Day header */}
            <div className="flex items-center justify-between px-4 py-2 bg-secondary/50 border-b border-border">
              <div className="flex items-center gap-2">
                {isToday && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-[#1D9E75] text-white">
                    Hari ini
                  </span>
                )}
                <span className="text-[13px] font-medium text-foreground">
                  {dayName}, {dayNum} {monthName} {year}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                {highCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {highCount} high
                  </span>
                )}
                <span>{dayEvents.length} event</span>
              </div>
            </div>

            {/* Events */}
            <div>
              {dayEvents.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function toJakartaDateKey(isoString: string): string {
  // Returns YYYY-MM-DD in Asia/Jakarta (WIB = UTC+7)
  return new Date(isoString).toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

function todayKey(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}
