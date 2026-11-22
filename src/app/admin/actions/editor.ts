"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import { SECTION_KEYS, sectionContentSchemas, themeTokensSchema, type SectionKey } from "@/lib/content/schemas";
import type { AdminResult } from "@/components/admin/ActionForm";

const sectionDraftSchema = z.object({
  key: z.enum(SECTION_KEYS),
  position: z.number().int().min(0).max(100),
  enabled: z.boolean(),
  show_in_nav: z.boolean(),
  nav_label: z.string().trim().max(40),
  content: z.unknown(),
});

const draftSchema = z.object({
  sections: z.array(sectionDraftSchema).max(SECTION_KEYS.length),
  theme: themeTokensSchema,
  basePreset: z.string().max(40),
});

export type DraftPayload = z.input<typeof draftSchema>;

async function persistDraft(payload: DraftPayload): Promise<AdminResult> {
  const { supabase } = await assertAdmin();
  const parsed = draftSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: `Dados inválidos: ${parsed.error.issues[0].path.join(".")} — ${parsed.error.issues[0].message}` };

  for (const s of parsed.data.sections) {
    const schema = sectionContentSchemas[s.key as SectionKey];
    const content = schema.safeParse(s.content);
    if (!content.success) {
      const issue = content.error.issues[0];
      return { ok: false, error: `Seção "${s.key}": ${issue.path.join(".")} — ${issue.message}` };
    }
    const { error } = await supabase
      .from("wedding_sections")
      .update({
        draft: { position: s.position, enabled: s.enabled, show_in_nav: s.show_in_nav, nav_label: s.nav_label, content: content.data },
      })
      .eq("key", s.key);
    if (error) return { ok: false, error: error.message };
  }

  const { data: settings } = await supabase.from("wedding_settings").select("active_theme_id").eq("id", 1).single();
  if (settings?.active_theme_id) {
    const { error } = await supabase
      .from("wedding_themes")
      .update({ draft_tokens: parsed.data.theme, base_preset: parsed.data.basePreset })
      .eq("id", settings.active_theme_id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { data: theme, error } = await supabase
      .from("wedding_themes")
      .insert({ name: "Tema do site", base_preset: parsed.data.basePreset, tokens: parsed.data.theme, draft_tokens: parsed.data.theme })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    await supabase.from("wedding_settings").update({ active_theme_id: theme.id }).eq("id", 1);
  }
  return { ok: true };
}

export async function saveDraft(payload: DraftPayload): Promise<AdminResult> {
  const res = await persistDraft(payload);
  return res.ok ? { ok: true, message: "Rascunho salvo ✓" } : res;
}

export async function publishSite(payload: DraftPayload): Promise<AdminResult> {
  const res = await persistDraft(payload);
  if (!res.ok) return res;
  const { supabase } = await assertAdmin();
  const { error } = await supabase.rpc("admin_publish_site");
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true, message: "Site publicado ✓" };
}

export async function discardDraft(): Promise<AdminResult> {
  const { supabase } = await assertAdmin();
  await supabase.from("wedding_sections").update({ draft: null }).not("draft", "is", null);
  await supabase.from("wedding_themes").update({ draft_tokens: null }).not("draft_tokens", "is", null);
  return { ok: true, message: "Rascunho descartado" };
}
