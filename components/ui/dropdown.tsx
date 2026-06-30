import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function DropdownPanel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/35 bg-[rgba(8,19,31,0.94)] p-2 shadow-soft backdrop-blur",
        className
      )}
      {...props}
    />
  );
}

export function DropdownItem({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-primary/10 hover:text-foreground", className)}
      {...props}
    />
  );
}
