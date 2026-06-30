import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn("aurora-input h-10 w-full px-3 text-sm", className)} {...props}>
      {children}
    </select>
  );
}
