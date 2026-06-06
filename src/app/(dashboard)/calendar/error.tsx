"use client";

import { AlertTriangle } from "lucide-react";

export default function CalendarError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <h1 className="text-[20px] font-medium">Kalender Ekonomi</h1>
      </div>
      <div className="rounded-xl border border-border p-8 flex flex-col items-center gap-3 text-center">
        <AlertTriangle className="h-8 w-8 text-amber-500" />
        <div>
          <p className="text-[14px] font-medium">Terjadi kesalahan</p>
          <p className="text-[12px] text-muted-foreground mt-1 font-mono">{error.message}</p>
        </div>
        <button
          onClick={reset}
          className="mt-2 px-4 py-1.5 text-[12px] rounded-md border border-border hover:bg-secondary transition-colors"
        >
          Coba lagi
        </button>
      </div>
    </div>
  );
}
