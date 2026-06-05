interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: "positive" | "negative" | "neutral";
}

export function StatCard({ label, value, subValue, trend = "neutral" }: StatCardProps) {
  return (
    <div className="bg-secondary rounded-xl px-3.5 py-3">
      <p className="text-[12px] text-muted-foreground mb-1">{label}</p>
      <p
        className="text-[22px] font-medium leading-none"
        style={{
          color:
            trend === "positive"
              ? "var(--color-profit)"
              : trend === "negative"
              ? "var(--color-loss)"
              : "var(--color-foreground)",
        }}
      >
        {value}
      </p>
      {subValue && (
        <p className="text-[11px] text-muted-foreground mt-1">{subValue}</p>
      )}
    </div>
  );
}
