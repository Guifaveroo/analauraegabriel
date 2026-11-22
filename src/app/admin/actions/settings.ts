"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import { normalizePixKey, sanitizeText, type PixKeyType } from "@/lib/pix/brcode";
import { zonedLocalToIso } from "@/lib/format";
import { hashPassword } from "@/lib/security";
import type { AdminResult } from "@/components/admin/ActionForm";

const optNumber = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : Number(String(v).replace(",", "."))),
  z.number().min(-180).max(180).nullable(),
);
const str = (max: number) => z.string().trim().max(max).default("");

const settingsSchema = z.object({
  partner1_name: z.string().trim().min(1, "Informe o nome").max(60),
  partner2_name: z.string().trim().min(1, "Informe o nome").max(60),
  wedding_local: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Data e horário inválidos"),
  timezone: z.string().min(3).max(60),
  ceremony_name: str(120),
  ceremony_address: str(300),
  ceremony_time: str(20),
  ceremony_lat: optNumber,
  ceremony_lng: optNumber,
  reception_name: str(120),
  reception_address: str(300),
  reception_time: str(20),
  reception_lat: optNumber,
  reception_lng: optNumber,
  rsvp_mode: z.enum(["open", "closed"]),
  rsvp_allow_edit: z.boolean(),
  rsvp_deadline_local: z.string().optional(),
  open_rsvp_max_companions: z.coerce.number().int().min(0).max(20),
  site_title: str(120),
  site_description: str(300),
  og_photo_id: z.preprocess((v) => (v ? v : null), z.string().uuid().nullable()),
  allow_indexing: z.boolean(),
});

export async function saveSettings(form: FormData): Promise<AdminResult> {
  const { supabase } = await assertAdmin();
  const raw = Object.fromEntries(form.entries());
  const parsed = settingsSchema.safeParse({
    ...raw,
    rsvp_allow_edit: form.get("rsvp_allow_edit") === "on",
    allow_indexing: form.get("allow_indexing") === "on",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;

  try {
    new Intl.DateTimeFormat("pt-BR", { timeZone: d.timezone });
  } catch {
    return { ok: false, error: "Fuso horário inválido" };
  }

  const { wedding_local, rsvp_deadline_local, ...rest } = d;
  const { error } = await supabase
    .from("wedding_settings")
    .update({
      ...rest,
      wedding_at: zonedLocalToIso(wedding_local, d.timezone),
      rsvp_deadline: rsvp_deadline_local ? zonedLocalToIso(rsvp_deadline_local, d.timezone) : null,
    })
    .eq("id", 1);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

const pixSchema = z.object({
  pix_key_type: z.enum(["cpf", "cnpj", "email", "phone", "random"]),
  pix_key: z.string().trim().min(1, "Informe a chave PIX").max(100),
  pix_beneficiary: z.string().trim().min(2, "Informe o nome do beneficiário").max(60),
  pix_city: z.string().trim().min(2, "Informe a cidade").max(60),
});

export async function savePix(form: FormData): Promise<AdminResult> {
  const { supabase } = await assertAdmin();
  const parsed = pixSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  let key: string;
  try {
    key = normalizePixKey(parsed.data.pix_key_type as PixKeyType, parsed.data.pix_key);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  if (!sanitizeText(parsed.data.pix_beneficiary, 25)) return { ok: false, error: "Nome do beneficiário inválido" };
  if (!sanitizeText(parsed.data.pix_city, 15)) return { ok: false, error: "Cidade inválida" };

  const { error } = await supabase
    .from("wedding_settings")
    .update({ ...parsed.data, pix_key: key })
    .eq("id", 1);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true, message: "Chave PIX salva ✓" };
}

export async function saveGodparentsPassword(form: FormData): Promise<AdminResult> {
  const { supabase } = await assertAdmin();
  const remove = form.get("remove") === "1";
  const password = String(form.get("password") ?? "");
  if (!remove && password.length < 4) return { ok: false, error: "Use pelo menos 4 caracteres." };
  if (password.length > 100) return { ok: false, error: "Senha muito longa." };

  const { error } = await supabase
    .from("wedding_private")
    .upsert({ id: 1, godparents_password_hash: remove ? null : hashPassword(password), updated_at: new Date().toISOString() });
  if (error) return { ok: false, error: error.message };

  // protege/desprotege a seção conforme existência de senha
  await supabase.from("wedding_sections").update({ is_protected: !remove }).eq("key", "godparents");
  revalidatePath("/", "layout");
  return { ok: true, message: remove ? "Senha removida — manual público ✓" : "Senha definida — manual protegido ✓" };
}
