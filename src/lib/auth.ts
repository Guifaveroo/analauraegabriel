import "server-only";
import { redirect } from "next/navigation";
import { createSessionClient } from "./supabase/server";

/**
 * Garante que a requisição vem de um administrador (usuário do Supabase Auth
 * cadastrado em admin_users). Usado em todas as páginas e ações do painel.
 */
export async function requireAdmin() {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: admin } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) redirect("/admin/login?erro=sem-permissao");

  return { supabase, user };
}

/** Versão para Server Actions: lança erro em vez de redirecionar. */
export async function assertAdmin() {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada. Entre novamente.");
  const { data: admin } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) throw new Error("Sem permissão.");
  return { supabase, user };
}
