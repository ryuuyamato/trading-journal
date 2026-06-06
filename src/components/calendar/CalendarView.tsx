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
}

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export function CalendarView({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="py-20 text-center text-[13px] text-muted-foreground border border-border rounded-xl">
        Tidak ada event ekonomi dalam rentang ini.
        <br />
        <span className="text-[12px]">Coba sinkronkan data dengan klik tombol Sync.</span>
      </div>
    );
  }

  // Group events by date (UTC date)
  const grouped = new Map<string, Event[]>();
  for (const event of events) {
    const d = new Date(event.eventTime);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(event);
  }

  const sortedDates = Array.from(grouped.keys()).sort();

  return (
    <div className="space-y-4">
      {sortedDates.map((dateKey) => {
        const dayEvents = grouped.get(dateKey)!;
        const date = new Date(`${dateKey}T00:00:00Z`);
        const dayName = DAY_NAMES[date.getUTCDay()];
        const monthName = MONTH_NAMES[date.getUTCMonth()];
        const dayNum = date.getUTCDate();
        const year = date.getUTCFullYear();
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

function todayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
