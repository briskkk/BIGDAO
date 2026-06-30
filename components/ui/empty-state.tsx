import type { ReactNode } from "react";
import { DatabaseZap } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  icon,
  className
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-dashed border-border/35 bg-muted/25 p-8 text-center", className)}>
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
        {icon ?? <DatabaseZap className="h-5 w-5" />}
      </div>
      <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p> : null}
    </div>
  );
}
