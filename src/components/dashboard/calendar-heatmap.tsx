"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CalendarHeatmapProps {
  data: Record<string, number>;
}

function getLast12Weeks() {
  const weeks: Date[][] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from Sunday of 11 weeks ago
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

function cellColor(value: number | undefined) {
  if (value === undefined) return "bg-muted";
  if (value > 0) {
    if (value > 100) return "bg-[var(--color-profit)] opacity-100";
    if (value > 50) return "bg-[var(--color-profit)] opacity-70";
    return "bg-[var(--color-profit)] opacity-40";
  }
  if (value < 0) {
    if (value < -100) return "bg-[var(--color-loss)] opacity-100";
    if (value < -50) return "bg-[var(--color-loss)] opacity-70";
    return "bg-[var(--color-loss)] opacity-40";
  }
  return "bg-muted";
}

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function CalendarHeatmap({ data }: CalendarHeatmapProps) {
  const weeks = getLast12Weeks();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Kalender P&amp;L (12 minggu)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1.5">
          {/* Day labels */}
          <div className="flex flex-col gap-1 justify-around pt-5">
            {DAYS.map((d) => (
              <span key={d} className="text-[10px] text-muted-foreground w-6 text-right">
                {d}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {/* Month label on first day of month */}
                <span className="text-[10px] text-muted-foreground h-4 leading-4">
                  {week[0].getDate() <= 7
                    ? week[0].toLocaleString("id-ID", { month: "short" })
                    : ""}
                </span>
                {week.map((day, di) => {
                  const key = formatDay(day);
                  const val = data[key];
                  return (
                    <div
                      key={di}
                      title={`${key}: ${val !== undefined ? val.toLocaleString("id-ID", { minimumFractionDigits: 2 }) : "–"}`}
                      className={cn(
                        "w-4 h-4 rounded-sm cursor-default transition-opacity",
                        cellColor(val)
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
