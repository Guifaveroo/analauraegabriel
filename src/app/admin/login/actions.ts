"use server";

import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";
import { allowAction, visitorKey } from "@/lib/security";
import { createServiceClient } from "@/lib/supabase/admin";

type LoginState = { error: string; email: string } | null;

export async function signIn(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Informe e-mail e senha.", email };
  if (!(await allowAction("admin_login", 10, 15))) return { error: "Muitas tentativas. Aguarde alguns minutos.", email };

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "E-mail ou senha incorretos.", email };
  // login bem-sucedido não deve consumir o limite de tentativas
  await createServiceClient()
    .from("rate_limits")
    .delete()
    .eq("key_hash", await visitorKey())
    .eq("action", "admin_login")
    .then(() => undefined, () => undefined);
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
