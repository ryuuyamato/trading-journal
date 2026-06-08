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
    <div className="bg-secondary rounded-xl px-4 py-3.5 space-y-3">
      <p className="text-[12px] text-muted-foreground">Menang vs Kalah</p>
      {total === 0 ? (
        <p className="text-[12px] text-muted-foreground py-5 text-center">Belum ada trade tertutup</p>
      ) : (
        <>
          <div className="flex items-center justify-between text-[13px] font-medium">
            <span style={{ color: "var(--color-profit)" }}>{winCount} menang</span>
            <span style={{ color: "var(--color-loss)" }}>{lossCount} kalah</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden flex bg-border">
            <div className="h-full" style={{ width: `${winShare}%`, backgroundColor: "var(--color-profit)" }} />
            <div className="h-full" style={{ width: `${100 - winShare}%`, backgroundColor: "var(--color-loss)" }} />
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
            <span>
              Rata-rata menang{" "}
              <span className="font-medium" style={{ color: "var(--color-profit)" }}>{formatPnl(avgWin)}</span>
            </span>
            <span>
              Rata-rata kalah{" "}
              <span className="font-medium" style={{ color: "var(--color-loss)" }}>{formatPnl(-avgLoss)}</span>
            </span>
          </div>
        </>
      )}
    </div>
  );
}
