"use client";

import { useState } from "react";
import { SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { NewTradeDialog } from "@/components/trades/trade-form-dialog";
import { TradesTable } from "@/components/trades/views/trades-table";
import { TradesBoard } from "@/components/trades/views/trades-board";
import { TradesCalendar } from "@/components/trades/views/trades-calendar";
import { TradesGallery } from "@/components/trades/views/trades-gallery";
import type { AccountOption, TradeListItem } from "@/components/trades/types";

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
    <div className="space-y-0">
      {/* View tabs + actions */}
      <div className="flex items-center justify-between border-b border-border pb-0">
        <div className="flex gap-0">
          {VIEWS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setView(tab.value)}
              className={
                view === tab.value
                  ? "px-3 py-2 text-[13px] font-medium text-foreground border-b-2 border-foreground -mb-px transition-colors"
                  : "px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 pb-1">
          <button
            disabled
            title="Filter — segera hadir"
            className="flex items-center gap-1.5 px-2 py-1 text-[12px] text-muted-foreground/50 cursor-not-allowed rounded-md"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter
          </button>
          <button
            onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
            title={sortDir === "desc" ? "Terbaru lebih dulu — klik untuk membalik" : "Terlama lebih dulu — klik untuk membalik"}
            className="flex items-center gap-1.5 px-2 py-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
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
