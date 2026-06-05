"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface EquityCurveProps {
  data: { date: string; equity: number }[];
}

export function EquityCurve({ data }: EquityCurveProps) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-[13px] font-medium mb-3">Kurva ekuitas</p>
      {data.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-[12px] text-muted-foreground">
          Belum ada trade tertutup
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: string) => v.slice(5)}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => v.toLocaleString()}
              width={48}
            />
            <ReferenceLine y={0} stroke="var(--color-border)" strokeWidth={1} />
            <Tooltip
              formatter={(v) => [
                Number(v ?? 0).toLocaleString("id-ID", { minimumFractionDigits: 2 }),
                "Equity",
              ]}
              labelFormatter={(l) => `Tanggal: ${l}`}
              contentStyle={{
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                fontSize: 12,
                boxShadow: "none",
              }}
            />
            <Line
              type="monotone"
              dataKey="equity"
              stroke="#1D9E75"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: "#1D9E75", strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
