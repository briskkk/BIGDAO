import type { ButtonHTMLAttributes, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function TabsList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("inline-flex rounded-2xl border border-border/30 bg-muted/30 p-1", className)} {...props} />;
}

export function TabsTrigger({
  active,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={cn(
        "rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground",
        active && "bg-primary/12 text-primary shadow-[inset_0_0_0_1px_rgba(36,200,255,0.24)]",
        className
      )}
      {...props}
    />
  );
}
