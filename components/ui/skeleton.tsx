import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl border border-border/20 bg-[linear-gradient(90deg,rgba(145,180,220,0.06),rgba(36,200,255,0.12),rgba(145,180,220,0.06))]",
        className
      )}
      {...props}
    />
  );
}
