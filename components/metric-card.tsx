import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  sub,
  trend,
  icon
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  icon?: ReactNode;
}) {
  return (
    <Card className="min-h-32">
      <div className="mb-5 flex items-center justify-between text-sm text-muted-foreground">
        <span>{label}</span>
        <span className="rounded-xl border border-primary/15 bg-primary/10 p-2 text-primary">{icon}</span>
      </div>
      <div className="number text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">{value}</div>
      {sub ? (
        <p
          className={cn(
            "mt-3 text-sm",
            trend === "up" && "text-success",
            trend === "down" && "text-danger",
            trend === "neutral" && "text-muted-foreground"
          )}
        >
          {sub}
        </p>
      ) : null}
    </Card>
  );
}
