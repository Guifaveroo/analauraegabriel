import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "../env";

/**
 * Cliente com a chave Service Role. SOMENTE no servidor (import "server-only"
 * impede que este arquivo seja incluído no bundle do navegador).
 * Usado apenas para operações dos convidados que passam por funções SQL validadas.
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada");
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
