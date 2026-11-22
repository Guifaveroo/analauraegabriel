import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { themeTokensSchema, type Section } from "../content/schemas";
import { defaultSections, isPixConfigured, mergeStock, toSection, type RawSection } from "../data/site";
import { DEFAULT_THEME } from "../themes/presets";
import { PUBLIC_SETTINGS_COLUMNS, type Gift, type Photo, type SiteData, type WeddingSettings } from "../types";

/** Dados do editor: conteúdo publicado com o rascunho aplicado por cima. */
export async function loadEditorData(db: SupabaseClient) {
  const [sectionsRes, settingsRes, photosRes, giftsRes, stockRes, messagesRes] = await Promise.all([
    db.from("wedding_sections").select("*").order("position"),
    db.from("wedding_settings").select(PUBLIC_SETTINGS_COLUMNS).eq("id", 1).single(),
    db.from("photos").select("*").order("album").order("position"),
    db.from("gifts").select("*").eq("active", true).order("position"),
    db.rpc("public_gift_stock"),
    db.from("messages").select("id,name,message,created_at").eq("status", "approved").order("created_at", { ascending: false }).limit(60),
  ]);

  const settings = settingsRes.data as unknown as WeddingSettings;
  const rawSections = (sectionsRes.data ?? []) as RawSection[];
  const loaded = rawSections.map((s) => toSection(s, true)).filter(Boolean) as Section[];
  // garante que todas as seções existam (ex.: banco criado antes de uma nova seção)
  const sections = defaultSections().map((d) => loaded.find((s) => s.key === d.key) ?? d);
  const hasDraft = rawSections.some((s) => s.draft);

  let theme = DEFAULT_THEME.tokens;
  let basePreset = DEFAULT_THEME.id;
  let themeHasDraft = false;
  if (settings?.active_theme_id) {
    const { data: t } = await db.from("wedding_themes").select("tokens,draft_tokens,base_preset").eq("id", settings.active_theme_id).single();
    const parsed = themeTokensSchema.safeParse(t?.draft_tokens ?? t?.tokens);
    if (parsed.success) theme = parsed.data;
    basePreset = t?.base_preset ?? basePreset;
    themeHasDraft = Boolean(t?.draft_tokens);
  }

  const photos = (photosRes.data ?? []) as Photo[];
  const site: SiteData = {
    settings,
    theme,
    sections,
    photos: Object.fromEntries(photos.map((p) => [p.id, p])),
    gallery: photos.filter((p) => p.album === "gallery"),
    gifts: mergeStock((giftsRes.data ?? []) as Gift[], stockRes.data ?? []),
    messages: messagesRes.data ?? [],
    pixEnabled: settings ? isPixConfigured(settings) : false,
  };

  return { site, photos, basePreset, hasDraft: hasDraft || themeHasDraft };
}
