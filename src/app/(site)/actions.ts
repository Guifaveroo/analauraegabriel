"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/admin";
import { allowAction, GODPARENTS_COOKIE, isBot, signValue, verifyPassword } from "@/lib/security";
import { buildPixPayload, type PixKeyType } from "@/lib/pix/brcode";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

const fail = (error: string) => ({ ok: false as const, error });
const GENERIC = "Não foi possível concluir agora. Tente novamente em instantes.";
const SPAM = "Muitas tentativas. Aguarde alguns minutos e tente novamente.";

// ---------------------------------------------------------------- presentes --
const giftOrderSchema = z.object({
  giftId: z.string().uuid(),
  name: z.string().trim().min(2, "Informe seu nome").max(120),
  email: z.union([z.literal(""), z.string().trim().email("E-mail inválido").max(200)]),
  consent: z.literal("on", { message: "É preciso concordar com o uso dos dados" }),
});

export type GiftOrderView = {
  giftName: string;
  amount: number;
  txid: string;
  payload: string;
  beneficiary: string;
  pixKey: string;
};

/**
 * Registra a intenção de presentear (status PENDING) e devolve o PIX estático.
 * O valor vem do cadastro do presente no banco — nunca do navegador.
 * O clique do convidado NÃO confirma pagamento: isso é feito manualmente pelos noivos.
 */
export async function createGiftOrder(form: FormData): Promise<ActionResult<GiftOrderView>> {
  if (isBot(form)) return fail(GENERIC);
  const parsed = giftOrderSchema.safeParse({
    giftId: form.get("giftId"),
    name: form.get("name"),
    email: form.get("email") ?? "",
    consent: form.get("consent"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  if (!(await allowAction("gift_order", 6, 30))) return fail(SPAM);

  const db = createServiceClient();
  const { data: settings } = await db
    .from("wedding_settings")
    .select("pix_key_type,pix_key,pix_beneficiary,pix_city")
    .eq("id", 1)
    .single();
  if (!settings?.pix_key_type || !settings.pix_key) return fail("Os noivos ainda não configuraram a chave PIX.");

  const { data, error } = await db.rpc("create_gift_order", {
    p_gift_id: parsed.data.giftId,
    p_guest_name: parsed.data.name,
    p_guest_email: parsed.data.email || null,
  });
  if (error) {
    if (error.message.includes("GIFT_UNAVAILABLE")) return fail("Que pena! Este presente acabou de ser escolhido por outra pessoa.");
    if (error.message.includes("GIFT_NOT_FOUND")) return fail("Presente não encontrado.");
    console.error("create_gift_order", error.message);
    return fail(GENERIC);
  }
  const order = (data as { order_id: string; txid: string; amount: number; gift_name: string }[])[0];

  try {
    const payload = buildPixPayload({
      keyType: settings.pix_key_type as PixKeyType,
      key: settings.pix_key,
      beneficiary: settings.pix_beneficiary,
      city: settings.pix_city,
      amount: Number(order.amount),
      txid: order.txid,
    });
    revalidatePath("/");
    return {
      ok: true,
      data: {
        giftName: order.gift_name,
        amount: Number(order.amount),
        txid: order.txid,
        payload,
        beneficiary: settings.pix_beneficiary,
        pixKey: settings.pix_key,
      },
    };
  } catch (e) {
    console.error("pix payload", e);
    return fail("A chave PIX cadastrada é inválida. Avise os noivos, por favor.");
  }
}

// --------------------------------------------------------------------- RSVP --
export type RsvpGuest = {
  id: string;
  name: string;
  max_companions: number;
  response: { attending: boolean; companions: string[]; dietary: string; notes: string; responded_at: string } | null;
};

export async function lookupInvite(code: string, name: string): Promise<ActionResult<{ family: string | null; guests: RsvpGuest[] }>> {
  const c = String(code ?? "").trim().slice(0, 40);
  const n = String(name ?? "").trim().slice(0, 120);
  if (!c && n.length < 3) return fail("Informe o código do convite ou seu nome completo.");
  if (!(await allowAction("rsvp_lookup", 15, 15))) return fail(SPAM);

  const { data, error } = await createServiceClient().rpc("rsvp_lookup", { p_code: c || null, p_name: n || null });
  if (error) {
    console.error("rsvp_lookup", error.message);
    return fail(GENERIC);
  }
  if (!data) {
    return fail(
      c
        ? "Código de convite não encontrado. Confira o link recebido."
        : "Não encontramos seu nome na lista. Digite o nome completo como está no convite.",
    );
  }
  return { ok: true, data };
}

const companionsSchema = z.array(z.string().trim().min(1, "Informe o nome de cada acompanhante").max(120)).max(20);
const responseSchema = z.object({
  guestId: z.string().uuid().nullable(),
  name: z.string().trim().max(120),
  attending: z.boolean(),
  companions: companionsSchema,
  dietary: z.string().trim().max(500),
  notes: z.string().trim().max(1000),
});
const rsvpSubmitSchema = z.array(responseSchema).min(1).max(30);

const RSVP_ERRORS: Record<string, string> = {
  RSVP_CLOSED: "O prazo para confirmação foi encerrado.",
  RSVP_LOCKED: "Sua resposta já foi registrada e não pode mais ser alterada. Fale com os noivos.",
  TOO_MANY_COMPANIONS: "O número de acompanhantes ultrapassa o permitido no convite.",
  GUEST_REQUIRED: "A confirmação é exclusiva para convidados da lista.",
  GUEST_NOT_FOUND: "Convidado não encontrado.",
};

export async function submitRsvp(form: FormData): Promise<ActionResult> {
  if (isBot(form)) return fail(GENERIC);
  if (form.get("consent") !== "on") return fail("É preciso concordar com o uso dos dados.");
  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("responses") ?? "[]"));
  } catch {
    return fail(GENERIC);
  }
  const parsed = rsvpSubmitSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  if (parsed.data.some((r) => !r.guestId && r.name.length < 2)) return fail("Informe seu nome completo.");
  if (!(await allowAction("rsvp_submit", 10, 30))) return fail(SPAM);

  const db = createServiceClient();
  for (const r of parsed.data) {
    const { error } = await db.rpc("submit_rsvp", {
      p_guest_id: r.guestId,
      p_name: r.name,
      p_attending: r.attending,
      p_companions: r.attending ? r.companions : [],
      p_dietary: r.dietary,
      p_notes: r.notes,
    });
    if (error) {
      const known = Object.keys(RSVP_ERRORS).find((k) => error.message.includes(k));
      if (!known) console.error("submit_rsvp", error.message);
      return fail(known ? RSVP_ERRORS[known] : GENERIC);
    }
  }
  return { ok: true, data: undefined };
}

// ----------------------------------------------------------------- recados --
const messageSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(80),
  message: z.string().trim().min(3, "Escreva sua mensagem").max(1000, "Mensagem muito longa (máx. 1000 caracteres)"),
});

export async function postMessage(form: FormData): Promise<ActionResult> {
  if (isBot(form)) return { ok: true, data: undefined }; // finge sucesso para robôs
  const parsed = messageSchema.safeParse({ name: form.get("name"), message: form.get("message") });
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  if (form.get("consent") !== "on") return fail("É preciso concordar com a publicação da mensagem.");
  if (!(await allowAction("message", 3, 30))) return fail(SPAM);

  const { error } = await createServiceClient().from("messages").insert(parsed.data);
  if (error) {
    console.error("message insert", error.message);
    return fail(GENERIC);
  }
  return { ok: true, data: undefined };
}

// --------------------------------------------------------------- padrinhos --
export async function unlockGodparents(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const password = String(form.get("password") ?? "");
  if (!password) return fail("Digite a senha.");
  if (!(await allowAction("godparents", 8, 15))) return fail(SPAM);

  const { data } = await createServiceClient().from("wedding_private").select("godparents_password_hash").eq("id", 1).single();
  if (!verifyPassword(password, data?.godparents_password_hash)) return fail("Senha incorreta.");

  // o cookie fica atrelado à senha atual: trocar a senha invalida acessos antigos
  const binding = String(data?.godparents_password_hash).slice(-16);
  (await cookies()).set(GODPARENTS_COOKIE, signValue(binding, 60 * 60 * 24 * 60), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
  return { ok: true, data: undefined };
}
