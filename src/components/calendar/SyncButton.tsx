"use client";

import { useState } from "react";
import { RefreshCw, Check, AlertCircle } from "lucide-react";

type Status = "idle" | "syncing" | "done" | "error";

export function SyncButton() {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<{ upserted: number; analyzed: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSync() {
    setStatus("syncing");
    setResult(null);
    setErrorMsg(null);
    try {
      const secret = prompt("Masukkan sync secret:");
      if (!secret) {
        setStatus("idle");
        return;
      }
      const res = await fetch("/api/calendar/sync?weeks=both", {
        method: "POST",
        headers: { "x-sync-secret": secret },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync gagal");
      setResult({ upserted: data.upserted, analyzed: data.analyzed });
      setStatus("done");
      setTimeout(() => setStatus("idle"), 4000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Sync gagal");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 4000);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleSync}
        disabled={status === "syncing"}
        className="flex items-center gap-2 px-3 py-1.5 text-[12px] rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-50"
      >
        {status === "syncing" ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        ) : status === "done" ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : status === "error" ? (
          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" />
        )}
        {status === "syncing" ? "Sinkronisasi..." : "Sync ForexFactory"}
      </button>
      {status === "done" && result && (
        <p className="text-[11px] text-muted-foreground">
          {result.upserted} event disinkronkan
        </p>
      )}
      {status === "error" && errorMsg && (
        <p className="text-[11px] text-red-500">{errorMsg}</p>
      )}
    </div>
  );
}
