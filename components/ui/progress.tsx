import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-muted/70 ring-1 ring-border/30", className)}>
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent-primary),var(--accent-secondary))] shadow-[0_0_18px_rgba(36,200,255,0.32)] transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
