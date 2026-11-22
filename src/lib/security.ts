import "server-only";
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { createServiceClient } from "./supabase/admin";

function secret(): string {
  const s = process.env.SITE_COOKIE_SECRET;
  if (!s || s.length < 32) throw new Error("SITE_COOKIE_SECRET ausente ou curto (mínimo 32 caracteres)");
  return s;
}

/** Identificador anônimo do visitante (hash do IP) — o IP em si não é armazenado (LGPD). */
export async function visitorKey(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${ip}|${secret()}`).digest("hex").slice(0, 32);
}

/** Retorna true se o visitante ainda pode executar a ação. */
export async function allowAction(action: string, max: number, windowMinutes: number): Promise<boolean> {
  const { data, error } = await createServiceClient().rpc("hit_rate_limit", {
    p_key: await visitorKey(),
    p_action: action,
    p_max: max,
    p_window: `${windowMinutes} minutes`,
  });
  if (error) {
    console.error("rate limit", error.message);
    return true; // não bloquear convidados por falha do antispam
  }
  return Boolean(data);
}

/** Campo isca + tempo mínimo de preenchimento: robôs preenchem tudo e muito rápido. */
export function isBot(form: FormData): boolean {
  const trap = form.get("website");
  const started = Number(form.get("_t") ?? 0);
  const tooFast = started > 0 && Date.now() - started < 1500;
  return (typeof trap === "string" && trap.length > 0) || tooFast;
}

// Senha do manual dos padrinhos -----------------------------------------------
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 32);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(expected, actual);
}

// Cookie assinado (HMAC) ------------------------------------------------------
export function signValue(value: string, ttlSeconds: number): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const body = `${value}.${exp}`;
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifySignedValue(token: string | undefined, expectedValue: string): boolean {
  if (!token) return false;
  const idx = token.lastIndexOf(".");
  if (idx < 0) return false;
  const body = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const good = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(good);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const dot = body.lastIndexOf(".");
  const value = body.slice(0, dot);
  const exp = Number(body.slice(dot + 1));
  return value === expectedValue && exp > Date.now() / 1000;
}

export const GODPARENTS_COOKIE = "padrinhos_acesso";
