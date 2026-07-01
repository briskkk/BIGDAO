"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export async function signInAction(formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const message = error.message.toLowerCase().includes("email not confirmed")
      ? "邮箱尚未确认。请先打开 Supabase 发送的确认邮件，或在 Supabase Auth 设置中关闭 Confirm email。"
      : error.message;
    redirect(`/login?error=${encodeURIComponent(message)}&next=${encodeURIComponent(next)}`);
  }
  redirect(next);
}

export async function signUpAction(formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "");
  const next = String(formData.get("next") ?? "/");
  const supabase = await createClient();
  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName || email.split("@")[0] },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`
    }
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  if (!data.session) {
    redirect(
      `/login?message=${encodeURIComponent("注册成功。请先确认邮箱后再登录；如果这是个人开发环境，也可以在 Supabase Auth 设置中关闭 Confirm email。")}&next=${encodeURIComponent(next)}`
    );
  }
  redirect(next);
}

export async function signOutAction() {
  if (!hasSupabaseEnv()) redirect("/");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

async function getOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}
