export function CalendarSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2 bg-secondary/50 border-b border-border">
            <div className="h-4 w-48 bg-border rounded" />
          </div>
          {[0, 1, 2, 3].map((j) => (
            <div key={j} className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0">
              <div className="w-2 h-2 rounded-full bg-border shrink-0" />
              <div className="h-3 w-16 bg-border rounded" />
              <div className="h-5 w-12 bg-border rounded" />
              <div className="h-3 flex-1 bg-border rounded" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
