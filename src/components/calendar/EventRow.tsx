"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { EventAnalysisPanel } from "./EventAnalysisPanel";
import { cn } from "@/lib/utils";

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
  event: Event;
}

const IMPACT_DOT: Record<string, string> = {
  HIGH: "bg-red-500",
  MEDIUM: "bg-amber-400",
  LOW: "bg-green-500",
  HOLIDAY: "bg-blue-400",
};

const IMPACT_BG: Record<string, string> = {
  HIGH: "bg-red-50 dark:bg-red-950/20",
  MEDIUM: "bg-amber-50 dark:bg-amber-950/20",
  LOW: "",
  HOLIDAY: "bg-blue-50 dark:bg-blue-950/20",
};

export function EventRow({ event }: Props) {
  const [expanded, setExpanded] = useState(false);

  const time = new Date(event.eventTime);
  const timeStr = time.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });

  return (
    <div className={cn("border-b border-border last:border-0", IMPACT_BG[event.impact])}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-secondary/40 transition-colors"
      >
        {/* Impact dot */}
        <span className={cn("w-2 h-2 rounded-full shrink-0", IMPACT_DOT[event.impact] ?? "bg-border")} />

        {/* Time */}
        <span className="text-[12px] text-muted-foreground w-20 shrink-0 font-mono">
          {timeStr} <span className="text-[10px] opacity-60">WIB</span>
        </span>

        {/* Currency */}
        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-secondary border border-border text-foreground w-12 text-center shrink-0">
          {event.country}
        </span>

        {/* Title */}
        <span className="text-[13px] flex-1 truncate text-foreground">{event.title}</span>

        {/* Data columns */}
        <div className="hidden md:flex items-center gap-6 shrink-0">
          <DataCell label="Aktual" value={event.actual} />
          <DataCell label="Forecast" value={event.forecast} />
          <DataCell label="Sebelumnya" value={event.previous} />
        </div>

        {/* Chevron */}
        <ChevronRight
          className={cn(
            "h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-150",
            expanded && "rotate-90",
          )}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-3 md:pl-[calc(1rem+0.5rem+3.5rem+3rem+0.75rem+0.75rem)]">
          {/* Mobile data */}
          <div className="flex gap-4 mb-2 md:hidden">
            <DataCell label="Aktual" value={event.actual} />
            <DataCell label="Forecast" value={event.forecast} />
            <DataCell label="Sebelumnya" value={event.previous} />
          </div>

          <EventAnalysisPanel
            eventId={event.id}
            existing={event.analysis}
            impact={event.impact}
          />
        </div>
      )}
    </div>
  );
}

function DataCell({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="text-right">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-[12px] font-medium text-foreground">{value ?? "–"}</p>
    </div>
  );
}
