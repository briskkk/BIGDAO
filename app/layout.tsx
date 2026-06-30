import type { Metadata } from "next";
import "@/app/globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "家庭财富驾驶舱",
  description: "长期投资与家庭资产配置原型"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <AppShell configuredMode={hasSupabaseEnv() ? "supabase" : "demo"}>{children}</AppShell>
      </body>
    </html>
  );
}
