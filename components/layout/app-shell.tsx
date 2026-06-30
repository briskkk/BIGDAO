"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  BrainCircuit,
  BriefcaseBusiness,
  Goal,
  LayoutDashboard,
  Menu,
  Settings,
  WalletCards
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/", label: "财富总览", icon: LayoutDashboard },
  { href: "/portfolio", label: "持仓", icon: BriefcaseBusiness },
  { href: "/assets", label: "资产账户", icon: WalletCards },
  { href: "/ledger", label: "交易账本", icon: BookOpen },
  { href: "/goals", label: "目标", icon: Goal },
  { href: "/insights", label: "AI 策略", icon: BrainCircuit },
  { href: "/settings", label: "设置", icon: Settings }
];

export function AppShell({ children, configuredMode = "demo" }: { children: React.ReactNode; configuredMode?: "demo" | "supabase" }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen text-foreground">
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-72 border-r border-border/20 bg-[var(--bg-sidebar)] px-5 py-6 shadow-[18px_0_70px_rgba(0,0,0,0.28)] lg:block">
        <div className="mb-9 rounded-2xl border border-primary/15 bg-[linear-gradient(135deg,rgba(36,200,255,0.12),rgba(62,230,184,0.04))] p-4 shadow-glow">
          <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary shadow-[0_0_28px_rgba(36,200,255,0.18)]">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-normal text-foreground">家庭财富驾驶舱</h1>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-primary/85">Family Wealth OS</p>
          </div>
          </div>
        </div>
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-sm text-muted-foreground transition duration-200 hover:border-border/30 hover:bg-muted/35 hover:text-foreground",
                  active &&
                    "border-primary/25 bg-[linear-gradient(135deg,rgba(36,200,255,0.16),rgba(62,230,184,0.07))] text-foreground shadow-glow"
                )}
              >
                <span
                  className={cn(
                    "absolute left-0 top-3 h-6 w-0.5 rounded-full bg-primary opacity-0 shadow-[0_0_14px_var(--accent-primary)]",
                    active && "opacity-100"
                  )}
                />
                <Icon className={cn("h-4 w-4 transition", active ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-6 left-5 right-5 rounded-2xl border border-border/30 bg-muted/30 p-4 text-xs leading-6 text-muted-foreground shadow-line">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-medium text-foreground">SYSTEM STATUS</span>
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-success">{configuredMode === "demo" ? "DEMO" : "SUPABASE"}</span>
          </div>
          <div className="flex items-center gap-2 text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_12px_var(--accent-primary)]" />
            {configuredMode === "demo" ? "Mock repository online" : "Persistent ledger online"}
          </div>
          <p className="mt-3">{configuredMode === "demo" ? "不连接银行、券商、行情或真实 AI 服务。" : "数据按家庭空间隔离，行情与 AI 仍未接入。"}</p>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/25 bg-[rgba(8,19,31,0.86)] px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2 font-semibold">
          <Menu className="h-5 w-5" />
          家庭财富
        </div>
        <ThemeToggle />
      </header>
      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-7 border-t border-border/25 bg-[rgba(8,19,31,0.95)] px-1 py-1 backdrop-blur lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] text-muted-foreground",
                active && "border border-primary/20 bg-primary/10 text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate">{item.label.replace("财富", "")}</span>
            </Link>
          );
        })}
      </nav>
      <main className="pb-24 lg:ml-72 lg:pb-0">
        <div className="mx-auto min-h-screen w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-4 hidden justify-end lg:flex">
            <ThemeToggle />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
