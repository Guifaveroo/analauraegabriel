"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import type { AdminResult } from "@/components/admin/ActionForm";
import type { GiftOrderStatus } from "@/lib/types";

const ERRORS: Record<string, string> = {
  INVALID_TRANSITION: "Esta alteração de status não é permitida.",
  GIFT_UNAVAILABLE: "Não há unidade disponível deste presente para reativar a solicitação.",
  ORDER_NOT_FOUND: "Solicitação não encontrada.",
  NOT_ALLOWED: "Sem permissão.",
};

/**
 * Confirmação manual: os noivos conferem o PIX no app do banco e então
 * confirmam aqui. Toda mudança fica registrada no histórico.
 */
export async function setOrderStatus(orderId: string, status: GiftOrderStatus, note = ""): Promise<AdminResult> {
  const { supabase } = await assertAdmin();
  const id = z.string().uuid().parse(orderId);
  const st = z.enum(["PENDING", "PAID", "CANCELLED"]).parse(status);
  const { error } = await supabase.rpc("admin_set_order_status", { p_order_id: id, p_status: st, p_note: note.slice(0, 500) });
  if (error) {
    const known = Object.keys(ERRORS).find((k) => error.message.includes(k));
    return { ok: false, error: known ? ERRORS[known] : error.message };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function getOrderHistory(orderId: string) {
  const { supabase } = await assertAdmin();
  const { data } = await supabase
    .from("gift_order_events")
    .select("id,from_status,to_status,note,created_at")
    .eq("order_id", z.string().uuid().parse(orderId))
    .order("created_at");
  return data ?? [];
}
