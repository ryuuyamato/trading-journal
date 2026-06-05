import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  trend?: "positive" | "negative" | "neutral";
}

export function StatCard({ label, value, subValue, icon: Icon, trend = "neutral" }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p
              className={cn(
                "text-2xl font-bold tracking-tight",
                trend === "positive" && "text-[var(--color-profit)]",
                trend === "negative" && "text-[var(--color-loss)]"
              )}
            >
              {value}
            </p>
            {subValue && (
              <p className="text-xs text-muted-foreground">{subValue}</p>
            )}
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
