function formatPnl(v: number) {
  const prefix = v >= 0 ? "+" : "-";
  return `${prefix}$${Math.abs(v).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

interface WinLossBreakdownProps {
  winCount: number;
  lossCount: number;
  avgWin: number;
  avgLoss: number;
}

export function WinLossBreakdown({ winCount, lossCount, avgWin, avgLoss }: WinLossBreakdownProps) {
  const total = winCount + lossCount;
  const winShare = total > 0 ? (winCount / total) * 100 : 0;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card px-4 py-3.5">
      <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
        Menang vs Kalah
      </p>
      {total === 0 ? (
        <p className="py-5 text-center text-[12px] text-muted-foreground">Belum ada trade tertutup</p>
      ) : (
        <>
          <div className="num flex items-center justify-between text-[13px] font-semibold">
            <span className="text-profit">{winCount} menang</span>
            <span className="text-loss">{lossCount} kalah</span>
          </div>
          <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full" style={{ width: `${winShare}%`, backgroundColor: "var(--color-profit)" }} />
            <div className="h-full" style={{ width: `${100 - winShare}%`, backgroundColor: "var(--color-loss)" }} />
          </div>
          <div className="flex items-center justify-between pt-0.5 text-[11px] text-muted-foreground">
            <span>
              Rata-rata menang{" "}
              <span className="num font-semibold text-profit">{formatPnl(avgWin)}</span>
            </span>
            <span>
              Rata-rata kalah{" "}
              <span className="num font-semibold text-loss">{formatPnl(-avgLoss)}</span>
            </span>
          </div>
        </>
      )}
    </div>
  );
}
