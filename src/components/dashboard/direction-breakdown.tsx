interface DirectionBreakdownProps {
  longCount: number;
  shortCount: number;
  longWinRate: number;
  shortWinRate: number;
}

export function DirectionBreakdown({ longCount, shortCount, longWinRate, shortWinRate }: DirectionBreakdownProps) {
  const total = longCount + shortCount;
  const rows = [
    { label: "Long / Buy", count: longCount, winRate: longWinRate },
    { label: "Short / Sell", count: shortCount, winRate: shortWinRate },
  ];

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card px-4 py-3.5">
      <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
        Long vs Short
      </p>
      {total === 0 ? (
        <p className="py-5 text-center text-[12px] text-muted-foreground">Belum ada trade tertutup</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-medium">{r.label}</span>
                <span className="num text-muted-foreground">
                  {r.count} trade · {r.count > 0 ? `${r.winRate.toFixed(0)}% win rate` : "–"}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${r.count > 0 ? Math.min(100, r.winRate) : 0}%`,
                    backgroundColor: r.winRate >= 50 ? "var(--color-profit)" : "var(--color-loss)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
