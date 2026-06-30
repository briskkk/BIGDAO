import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "danger" | "warning" | "primary";

export function Badge({ className, tone = "neutral", ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  const tones: Record<Tone, string> = {
    neutral: "border-border/50 bg-muted/45 text-muted-foreground",
    success: "border-success/20 bg-success/10 text-success",
    danger: "border-danger/25 bg-danger/10 text-danger",
    warning: "border-warning/25 bg-warning/10 text-warning",
    primary: "border-primary/30 bg-primary/12 text-primary"
  };
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", tones[tone], className)} {...props} />;
}
