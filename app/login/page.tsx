import { BarChart3 } from "lucide-react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInAction, signUpAction } from "@/lib/actions/auth-actions";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string; next?: string }> }) {
  if (!hasSupabaseEnv()) redirect("/");
  const params = await searchParams;
  const next = params.next ?? "/";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
      <div className="grid w-full gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="aurora-panel p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary shadow-glow">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Family Wealth OS</h1>
              <p className="mt-1 text-sm text-muted-foreground">Supabase 持久化账本模式</p>
            </div>
          </div>
          <p className="mt-6 text-sm leading-6 text-muted-foreground">
            登录后会进入你的家庭空间。注册用户会自动创建 profile、family、owner 成员关系、默认现金账户和 1,500 万目标。
          </p>
          {params.error ? <div className="mt-5 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{params.error}</div> : null}
          {params.message ? <div className="mt-5 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{params.message}</div> : null}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <form action={signInAction} className="aurora-panel p-6">
            <h2 className="text-xl font-semibold">邮箱登录</h2>
            <input type="hidden" name="next" value={next} />
            <label className="mt-5 block text-sm text-muted-foreground">邮箱<Input className="mt-2" name="email" type="email" required /></label>
            <label className="mt-4 block text-sm text-muted-foreground">密码<Input className="mt-2" name="password" type="password" required minLength={6} /></label>
            <Button className="mt-6 w-full" type="submit">登录</Button>
            <p className="mt-4 text-xs text-muted-foreground">找回密码入口已预留，本轮暂不实现邮件重置流程。</p>
          </form>

          <form action={signUpAction} className="aurora-panel p-6">
            <h2 className="text-xl font-semibold">注册家庭空间</h2>
            <input type="hidden" name="next" value={next} />
            <label className="mt-5 block text-sm text-muted-foreground">显示名<Input className="mt-2" name="displayName" /></label>
            <label className="mt-4 block text-sm text-muted-foreground">邮箱<Input className="mt-2" name="email" type="email" required /></label>
            <label className="mt-4 block text-sm text-muted-foreground">密码<Input className="mt-2" name="password" type="password" required minLength={6} /></label>
            <Button className="mt-6 w-full" type="submit" variant="secondary">注册</Button>
          </form>
        </section>
      </div>
    </div>
  );
}
