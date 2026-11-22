"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import type { AdminResult } from "@/components/admin/ActionForm";

const giftSchema = z
  .object({
    id: z.preprocess((v) => (v ? v : null), z.string().uuid().nullable()),
    name: z.string().trim().min(2, "Informe o nome do presente").max(120),
    description: z.string().trim().max(1000).default(""),
    category: z.string().trim().max(60).default(""),
    price: z.preprocess(
      (v) => {
        const t = String(v ?? "").trim().replace(/[R$\s]/g, "");
        return Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t);
      },
      z.number({ message: "Valor inválido" }).positive("O valor deve ser maior que zero").max(100000),
    ),
    mode: z.enum(["single", "limited", "unlimited"]),
    quantity: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().min(1).max(1000).nullable()),
    photo_id: z.preprocess((v) => (v ? v : null), z.string().uuid().nullable()),
    active: z.boolean(),
  })
  .transform((g) => ({
    ...g,
    price: Math.round(g.price * 100) / 100,
    quantity: g.mode === "single" ? 1 : g.mode === "unlimited" ? null : g.quantity,
  }))
  .refine((g) => g.mode !== "limited" || (g.quantity ?? 0) >= 1, { message: "Informe a quantidade disponível" });

export async function saveGift(form: FormData): Promise<AdminResult> {
  const { supabase } = await assertAdmin();
  const parsed = giftSchema.safeParse({ ...Object.fromEntries(form.entries()), active: form.get("active") === "on" });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { id, ...data } = parsed.data;

  if (id) {
    const { error } = await supabase.from("gifts").update(data).eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { count } = await supabase.from("gifts").select("id", { count: "exact", head: true });
    const { error } = await supabase.from("gifts").insert({ ...data, position: count ?? 0 });
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/", "layout");
  return { ok: true, message: id ? "Presente atualizado ✓" : "Presente cadastrado ✓" };
}

export async function moveGift(id: string, direction: -1 | 1): Promise<AdminResult> {
  const { supabase } = await assertAdmin();
  const { data } = await supabase.from("gifts").select("id,position").order("position").order("created_at");
  const list = (data ?? []).map((g, i) => ({ ...g, position: i }));
  const idx = list.findIndex((g) => g.id === id);
  const swap = list[idx + direction];
  if (idx < 0 || !swap) return { ok: true };
  [list[idx].position, swap.position] = [swap.position, list[idx].position];
  await Promise.all(list.map((g) => supabase.from("gifts").update({ position: g.position }).eq("id", g.id)));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteGift(id: string): Promise<AdminResult> {
  const { supabase } = await assertAdmin();
  const { count } = await supabase.from("gift_orders").select("id", { count: "exact", head: true }).eq("gift_id", id);
  if (count) {
    // presentes com histórico não são apagados (integridade dos pagamentos): apenas desativados
    await supabase.from("gifts").update({ active: false }).eq("id", id);
    revalidatePath("/", "layout");
    return { ok: true, message: "O presente possui solicitações e foi desativado." };
  }
  const { error } = await supabase.from("gifts").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
