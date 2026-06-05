"use client";

import { cn } from "@/lib/utils";

interface CalendarHeatmapProps {
  data: Record<string, number>;
}

function getLast12Weeks() {
  const weeks: Date[][] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - start.getDay() - 7 * 11);
  for (let w = 0; w < 12; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setDate(start.getDate() + w * 7 + d);
      week.push(day);
    }
    weeks.push(week);
  }
  return weeks;
}

function formatDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

function cellBg(value: number | undefined): string {
  if (value === undefined) return "#F1EFE8";
  if (value > 0) {
    if (value > 100) return "#1D9E75";
    if (value > 30)  return "#9FE1CB";
    return "#E1F5EE";
  }
  if (value < 0) {
    if (value < -100) return "#E24B4A";
    if (value < -30)  return "#F7C1C1";
    return "#FCEBEB";
  }
  return "#F1EFE8";
}

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function CalendarHeatmap({ data }: CalendarHeatmapProps) {
  const weeks = getLast12Weeks();

  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-[13px] font-medium mb-3">Kalender P&amp;L</p>
      <div className="flex gap-1.5">
        {/* Day labels */}
        <div className="flex flex-col gap-1 pt-5">
          {DAYS.map((d) => (
            <span key={d} className="text-[10px] text-muted-foreground w-6 text-right leading-4 h-4">
              {d}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground h-4 leading-4">
                {week[0].getDate() <= 7
                  ? week[0].toLocaleString("id-ID", { month: "short" })
                  : ""}
              </span>
              {week.map((day, di) => {
                const key = formatDay(day);
                const val = data[key];
                const title =
                  val !== undefined
                    ? `${key}: ${val >= 0 ? "+" : ""}${val.toLocaleString("id-ID", { minimumFractionDigits: 2 })}`
                    : key;
                return (
                  <div
                    key={di}
                    title={title}
                    className={cn("w-4 h-4 rounded-sm cursor-default")}
                    style={{ backgroundColor: cellBg(val) }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
