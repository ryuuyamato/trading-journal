"use client";

import { useRouter } from "next/navigation";
import { ImageOff } from "lucide-react";
import { PropertyPill } from "@/components/ui/property-pill";
import type { TradeListItem } from "@/components/trades/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function TradesGallery({ trades }: { trades: TradeListItem[] }) {
  const router = useRouter();

  const withScreenshots = trades.filter((t) => t.screenshots.length > 0);

  if (withScreenshots.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center gap-2 text-muted-foreground">
        <ImageOff className="h-6 w-6 opacity-50" />
        <p className="text-[13px]">Belum ada screenshot trade.</p>
        <p className="text-[12px]">Buka detail trade untuk menambahkan screenshot.</p>
      </div>
    );
  }

  return (
    <div className="py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {withScreenshots.flatMap((trade) => {
        const marketType =
          trade.account.marketType === "MULTI_ASSET" && trade.tradeMarketType
            ? trade.tradeMarketType
            : trade.account.marketType;

        return trade.screenshots.map((s) => (
          <button
            key={s.id}
            onClick={() => router.push(`/trades/${trade.id}`)}
            className="group text-left rounded-xl overflow-hidden border border-border hover:border-foreground/30 transition-colors"
          >
            {/* External, user-supplied URLs — next/image's optimizer would need every host allow-listed */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.url} alt={s.caption ?? trade.symbol} className="w-full h-32 object-cover bg-muted" />
            <div className="p-2 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-medium">{trade.symbol}</span>
                <PropertyPill marketType={marketType ?? undefined} />
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {s.caption ?? formatDate(trade.openTime)}
              </p>
            </div>
          </button>
        ));
      })}
    </div>
  );
}
