"use server";

import { z } from "zod";
import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import type { AdminResult } from "@/components/admin/ActionForm";

const optionalUuid = z.preprocess((v) => (v ? v : null), z.string().uuid().nullable());

const guestSchema = z.object({
  id: optionalUuid,
  name: z.string().trim().min(2, "Informe o nome do convidado").max(120),
  phone: z.string().trim().max(30).default(""),
  email: z.union([z.literal(""), z.string().trim().email("E-mail inválido").max(200)]).default(""),
  family_id: optionalUuid,
  category_id: optionalUuid,
  max_companions: z.coerce.number().int().min(0, "Mínimo 0").max(20, "Máximo 20"),
  notes: z.string().trim().max(500).default(""),
});

export async function saveGuest(form: FormData): Promise<AdminResult> {
  const { supabase } = await assertAdmin();
  const parsed = guestSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { id, ...data } = parsed.data;
  const { error } = id
    ? await supabase.from("guests").update(data).eq("id", id)
    : await supabase.from("guests").insert(data);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/convidados");
  return { ok: true, message: id ? "Convidado atualizado ✓" : "Convidado adicionado ✓" };
}

export async function deleteGuest(id: string): Promise<AdminResult> {
  const { supabase } = await assertAdmin();
  const { error } = await supabase.from("guests").delete().eq("id", z.string().uuid().parse(id));
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/convidados");
  return { ok: true };
}

/** Cadastro rápido: um nome por linha. */
export async function bulkAddGuests(form: FormData): Promise<AdminResult> {
  const { supabase } = await assertAdmin();
  const names = String(form.get("names") ?? "")
    .split(/\r?\n/)
    .map((n) => n.trim().replace(/\s+/g, " "))
    .filter((n) => n.length >= 2 && n.length <= 120)
    .slice(0, 300);
  if (names.length === 0) return { ok: false, error: "Digite ao menos um nome (um por linha)." };
  const family_id = optionalUuid.parse(form.get("family_id"));
  const category_id = optionalUuid.parse(form.get("category_id"));
  const max_companions = z.coerce.number().int().min(0).max(20).parse(form.get("max_companions") ?? 0);
  const { error } = await supabase.from("guests").insert(names.map((name) => ({ name, family_id, category_id, max_companions })));
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/convidados");
  return { ok: true, message: `${names.length} convidado(s) adicionado(s) ✓` };
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const makeCode = () => Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");

const groupSchema = z.object({
  id: optionalUuid,
  name: z.string().trim().min(1, "Informe o nome").max(120),
  type: z.enum(["family", "category"]),
});

export async function saveGroup(form: FormData): Promise<AdminResult> {
  const { supabase } = await assertAdmin();
  const parsed = groupSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { id, name, type } = parsed.data;

  if (id) {
    const { error } = await supabase.from("guest_groups").update({ name }).eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    for (let attempt = 0; attempt < 5; attempt++) {
      const { error } = await supabase.from("guest_groups").insert({ name, type, invite_code: type === "family" ? makeCode() : null });
      if (!error) break;
      if (!error.message.includes("invite_code") || attempt === 4) return { ok: false, error: error.message };
    }
  }
  revalidatePath("/admin/convidados");
  return { ok: true, message: "Grupo salvo ✓" };
}

export async function regenerateInviteCode(id: string): Promise<AdminResult> {
  const { supabase } = await assertAdmin();
  const { error } = await supabase.from("guest_groups").update({ invite_code: makeCode() }).eq("id", id).eq("type", "family");
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/convidados");
  return { ok: true };
}

export async function deleteGroup(id: string): Promise<AdminResult> {
  const { supabase } = await assertAdmin();
  const { error } = await supabase.from("guest_groups").delete().eq("id", z.string().uuid().parse(id));
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/convidados");
  return { ok: true };
}

export async function deleteRsvpResponse(id: string): Promise<AdminResult> {
  const { supabase } = await assertAdmin();
  const { error } = await supabase.from("rsvp_responses").delete().eq("id", z.string().uuid().parse(id));
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/confirmacoes");
  return { ok: true };
}

/** LGPD: apaga todos os dados de convidados, respostas e mensagens. */
export async function purgeGuestData(form: FormData): Promise<AdminResult> {
  const { supabase } = await assertAdmin();
  if (form.get("confirm") !== "APAGAR") return { ok: false, error: 'Digite APAGAR para confirmar.' };
  await supabase.from("rsvp_responses").delete().not("id", "is", null);
  await supabase.from("guests").delete().not("id", "is", null);
  await supabase.from("guest_groups").delete().not("id", "is", null);
  await supabase.from("messages").delete().not("id", "is", null);
  revalidatePath("/", "layout");
  return { ok: true, message: "Dados apagados." };
}
