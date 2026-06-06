"use client";

import { useState } from "react";
import { Loader2, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface EventAnalysis {
  id: string;
  summary: string;
  bias: string;
  instruments: string[];
}

interface Props {
  eventId: string;
  existing?: EventAnalysis | null;
  impact: string;
}

export function EventAnalysisPanel({ eventId, existing, impact }: Props) {
  const [analysis, setAnalysis] = useState<EventAnalysis | null>(existing ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestAnalysis() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Gagal memuat analisis");
      }
      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  if (!analysis) {
    return (
      <div className="mt-3 pt-3 border-t border-border">
        {impact === "HIGH" ? (
          <button
            onClick={requestAnalysis}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-[12px] rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {loading ? "Menganalisis..." : "Minta analisis AI"}
          </button>
        ) : (
          <button
            onClick={requestAnalysis}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-[12px] rounded-md border border-dashed border-border text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 opacity-50" />
            )}
            {loading ? "Menganalisis..." : "Analisis AI"}
          </button>
        )}
        {error && <p className="mt-2 text-[11px] text-red-500">{error}</p>}
      </div>
    );
  }

  const isBullish = analysis.bias.includes("BULLISH");
  const isBearish = analysis.bias.includes("BEARISH");

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-2">
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-[#1D9E75] shrink-0" />
        <span className="text-[11px] font-medium text-[#1D9E75]">Analisis AI</span>
        {analysis.bias && (
          <span className={`ml-auto flex items-center gap-1 text-[11px] font-medium ${
            isBullish ? "text-green-600" : isBearish ? "text-red-500" : "text-muted-foreground"
          }`}>
            {isBullish ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : isBearish ? (
              <TrendingDown className="h-3.5 w-3.5" />
            ) : (
              <Minus className="h-3.5 w-3.5" />
            )}
            {analysis.bias}
          </span>
        )}
      </div>

      <p className="text-[12px] text-foreground leading-relaxed">{analysis.summary}</p>

      {analysis.instruments.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {analysis.instruments.map((inst) => (
            <span
              key={inst}
              className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-secondary text-muted-foreground border border-border"
            >
              {inst}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
