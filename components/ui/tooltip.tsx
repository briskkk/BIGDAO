import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Tooltip({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "rounded-xl border border-border/35 bg-[rgba(8,19,31,0.94)] px-3 py-2 text-xs text-foreground shadow-soft backdrop-blur",
        className
      )}
      {...props}
    />
  );
}
