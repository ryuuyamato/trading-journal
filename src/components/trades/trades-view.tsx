"use client";

import { useState } from "react";
import { SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { NewTradeDialog } from "@/components/trades/trade-form-dialog";
import { TradesTable } from "@/components/trades/views/trades-table";
import { TradesBoard } from "@/components/trades/views/trades-board";
import { TradesCalendar } from "@/components/trades/views/trades-calendar";
import { TradesGallery } from "@/components/trades/views/trades-gallery";
import type { AccountOption, TradeListItem } from "@/components/trades/types";
import { cn } from "@/lib/utils";

const VIEWS = [
  { value: "table", label: "Tabel" },
  { value: "board", label: "Board" },
  { value: "calendar", label: "Kalender" },
  { value: "gallery", label: "Galeri" },
] as const;

type ViewValue = (typeof VIEWS)[number]["value"];

export function TradesView({ accounts, trades }: { accounts: AccountOption[]; trades: TradeListItem[] }) {
  const [view, setView] = useState<ViewValue>("table");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const sorted = [...trades].sort((a, b) => {
    const diff = new Date(a.openTime).getTime() - new Date(b.openTime).getTime();
    return sortDir === "asc" ? diff : -diff;
  });

  return (
    <div className="space-y-3">
      {/* View switcher + actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Segmented control: the whole set of views stays visible, and the
            active one is a raised chip rather than an underline. */}
        <div className="flex items-center gap-0.5 rounded-md bg-secondary p-[3px]">
          {VIEWS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setView(tab.value)}
              className={cn(
                "rounded-md px-3 py-1 text-[12.5px] transition-colors",
                view === tab.value
                  ? "bg-accent font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            disabled
            title="Filter — segera hadir"
            className="flex cursor-not-allowed items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-muted-foreground/40"
          >
            <SlidersHorizontal className="size-3.5" />
            Filter
          </button>
          <button
            onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
            title={sortDir === "desc" ? "Terbaru lebih dulu — klik untuk membalik" : "Terlama lebih dulu — klik untuk membalik"}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowUpDown className="size-3.5" />
            Urut · {sortDir === "desc" ? "Terbaru" : "Terlama"}
          </button>
          <NewTradeDialog accounts={accounts} />
        </div>
      </div>

      {view === "table" && <TradesTable trades={sorted} accounts={accounts} />}
      {view === "board" && <TradesBoard trades={sorted} />}
      {view === "calendar" && <TradesCalendar trades={sorted} />}
      {view === "gallery" && <TradesGallery trades={sorted} />}
    </div>
  );
}
