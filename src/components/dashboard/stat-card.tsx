import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: "positive" | "negative" | "neutral";
}

export function StatCard({ label, value, subValue, trend = "neutral" }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card px-3.5 py-3">
      <p className="text-[10.5px] tracking-wider text-muted-foreground uppercase">{label}</p>
      <p
        className={cn(
          "num mt-1.5 text-[21px] leading-none font-semibold",
          trend === "positive"
            ? "text-profit"
            : trend === "negative"
            ? "text-loss"
            : "text-foreground"
        )}
      >
        {value}
      </p>
      {subValue && <p className="mt-1.5 text-[11px] text-muted-foreground">{subValue}</p>}
    </div>
  );
}
