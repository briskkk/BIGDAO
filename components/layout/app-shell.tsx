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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-72 border-r border-border/70 bg-card/90 px-5 py-6 shadow-line backdrop-blur lg:block">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Family Wealth</p>
            <h1 className="text-lg font-semibold tracking-normal">家庭财富驾驶舱</h1>
          </div>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground",
                  active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-6 left-5 right-5 rounded-lg bg-muted/70 p-4 text-xs leading-6 text-muted-foreground">
          第一阶段使用高质量模拟数据；不连接银行、券商、行情或真实 AI 服务。
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/70 bg-card/85 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2 font-semibold">
          <Menu className="h-5 w-5" />
          家庭财富
        </div>
        <ThemeToggle />
      </header>
      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-7 border-t border-border/70 bg-card/95 px-1 py-1 backdrop-blur lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-md px-1 py-2 text-[10px] text-muted-foreground",
                active && "bg-muted text-foreground"
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
