"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import { PHOTOS_BUCKET } from "@/lib/env";
import type { AdminResult } from "@/components/admin/ActionForm";
import { ALBUMS } from "@/lib/admin/albums";

const registerSchema = z.object({
  id: z.string().uuid(),
  album: z.enum(ALBUMS),
  width: z.number().int().min(1).max(10000),
  height: z.number().int().min(1).max(10000),
  caption: z.string().trim().max(300).default(""),
});

/** Registra no banco uma foto já enviada ao Storage pelo navegador. */
export async function registerPhoto(input: z.input<typeof registerSchema>): Promise<AdminResult & { id?: string }> {
  const { supabase } = await assertAdmin();
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados da foto inválidos" };
  const d = parsed.data;

  const { count } = await supabase.from("photos").select("id", { count: "exact", head: true }).eq("album", d.album);
  const { error } = await supabase.from("photos").insert({
    id: d.id,
    storage_path: `full/${d.id}.webp`,
    thumb_path: `thumb/${d.id}.webp`,
    width: d.width,
    height: d.height,
    caption: d.caption,
    album: d.album,
    position: count ?? 0,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true, id: d.id };
}

const updateSchema = z.object({
  id: z.string().uuid(),
  caption: z.string().trim().max(300),
  album: z.enum(ALBUMS),
});

export async function updatePhoto(form: FormData): Promise<AdminResult> {
  const { supabase } = await assertAdmin();
  const parsed = updateSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { id, ...rest } = parsed.data;
  const { error } = await supabase.from("photos").update(rest).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Define a imagem principal da galeria (exibida primeiro). */
export async function setFeaturedPhoto(id: string): Promise<AdminResult> {
  const { supabase } = await assertAdmin();
  const { data: photo } = await supabase.from("photos").select("album").eq("id", id).single();
  if (!photo) return { ok: false, error: "Foto não encontrada" };
  await supabase.from("photos").update({ is_featured: false }).eq("album", photo.album);
  await supabase.from("photos").update({ is_featured: true, position: -1 }).eq("id", id);
  await normalizePositions(supabase, photo.album);
  revalidatePath("/", "layout");
  return { ok: true };
}

async function normalizePositions(supabase: Awaited<ReturnType<typeof assertAdmin>>["supabase"], album: string) {
  const { data } = await supabase.from("photos").select("id,position").eq("album", album).order("position").order("created_at");
  await Promise.all((data ?? []).map((p, i) => (p.position === i ? null : supabase.from("photos").update({ position: i }).eq("id", p.id))));
}

export async function movePhoto(id: string, direction: -1 | 1): Promise<AdminResult> {
  const { supabase } = await assertAdmin();
  const { data: photo } = await supabase.from("photos").select("album").eq("id", id).single();
  if (!photo) return { ok: false, error: "Foto não encontrada" };
  await normalizePositions(supabase, photo.album);
  const { data: list } = await supabase.from("photos").select("id,position").eq("album", photo.album).order("position");
  const items = list ?? [];
  const idx = items.findIndex((p) => p.id === id);
  const swap = items[idx + direction];
  if (idx < 0 || !swap) return { ok: true };
  await Promise.all([
    supabase.from("photos").update({ position: swap.position }).eq("id", id),
    supabase.from("photos").update({ position: items[idx].position }).eq("id", swap.id),
  ]);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Remove referências a uma foto do conteúdo das seções (publicado e rascunho). */
function scrub(value: unknown, id: string): unknown {
  if (Array.isArray(value)) return value.filter((v) => v !== id).map((v) => scrub(v, id));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, v === id ? null : scrub(v, id)]));
  }
  return value;
}

export async function deletePhoto(id: string): Promise<AdminResult> {
  const { supabase } = await assertAdmin();
  const { data: photo } = await supabase.from("photos").select("storage_path,thumb_path").eq("id", id).single();
  if (!photo) return { ok: false, error: "Foto não encontrada" };

  const { data: sections } = await supabase.from("wedding_sections").select("key,content,draft");
  for (const s of sections ?? []) {
    const raw = JSON.stringify([s.content, s.draft]);
    if (raw.includes(id)) {
      await supabase
        .from("wedding_sections")
        .update({ content: scrub(s.content, id), draft: s.draft ? scrub(s.draft, id) : null })
        .eq("key", s.key);
    }
  }

  const { error: storageError } = await supabase.storage.from(PHOTOS_BUCKET).remove([photo.storage_path, photo.thumb_path]);
  if (storageError) return { ok: false, error: storageError.message };
  const { error } = await supabase.from("photos").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
