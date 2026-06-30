import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function ChartContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/25 bg-[radial-gradient(circle_at_20%_0%,rgba(36,200,255,0.08),transparent_28%),rgba(8,19,31,0.28)] p-3",
        className
      )}
      {...props}
    />
  );
}
