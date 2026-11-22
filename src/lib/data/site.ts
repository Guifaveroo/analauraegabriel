import "server-only";
import { parseSectionContent, SECTION_KEYS, themeTokensSchema, type Section, type SectionKey } from "../content/schemas";
import { DEFAULT_THEME } from "../themes/presets";
import { createPublicClient } from "../supabase/public";
import { createServiceClient } from "../supabase/admin";
import { PUBLIC_SETTINGS_COLUMNS, type Gift, type GiftWithStock, type Photo, type SiteData, type WeddingSettings } from "../types";
import { isSupabaseConfigured } from "../env";
import { DEFAULT_SECTIONS } from "../content/defaults";

export type RawSection = {
  key: string;
  position: number;
  enabled: boolean;
  show_in_nav: boolean;
  nav_label: string;
  is_protected: boolean;
  content: unknown;
  draft?: Record<string, unknown> | null;
};

export function toSection(raw: RawSection, useDraft = false): Section | null {
  if (!SECTION_KEYS.includes(raw.key as SectionKey)) return null;
  const key = raw.key as SectionKey;
  const d = useDraft && raw.draft ? raw.draft : {};
  return {
    key,
    position: (d.position as number) ?? raw.position,
    enabled: (d.enabled as boolean) ?? raw.enabled,
    show_in_nav: (d.show_in_nav as boolean) ?? raw.show_in_nav,
    nav_label: (d.nav_label as string) ?? raw.nav_label,
    is_protected: (d.is_protected as boolean) ?? raw.is_protected,
    content: parseSectionContent(key, d.content ?? raw.content),
  } as Section;
}

export function defaultSections(): Section[] {
  return SECTION_KEYS.map((key) => ({ key, enabled: true, is_protected: false, ...DEFAULT_SECTIONS[key] })) as Section[];
}

/** Usado quando o Supabase ainda não foi configurado (primeiro deploy). */
export function fallbackSiteData(): SiteData {
  return {
    settings: {
      partner1_name: "Ana",
      partner2_name: "Laura",
      wedding_at: new Date(Date.now() + 180 * 864e5).toISOString(),
      timezone: "America/Sao_Paulo",
      ceremony_name: "Local da cerimônia",
      ceremony_address: "Configure o endereço no painel",
      ceremony_time: "",
      ceremony_lat: null,
      ceremony_lng: null,
      reception_name: "",
      reception_address: "",
      reception_time: "",
      reception_lat: null,
      reception_lng: null,
      pix_key_type: null,
      pix_key: "",
      pix_beneficiary: "",
      pix_city: "",
      rsvp_mode: "open",
      rsvp_allow_edit: true,
      rsvp_deadline: null,
      open_rsvp_max_companions: 2,
      site_title: "",
      site_description: "",
      og_photo_id: null,
      allow_indexing: false,
      active_theme_id: null,
    },
    theme: DEFAULT_THEME.tokens,
    sections: defaultSections(),
    photos: {},
    gallery: [],
    gifts: [],
    messages: [],
    pixEnabled: false,
  };
}

export function mergeStock(
  gifts: Gift[],
  stock: { gift_id: string; remaining: number | null; status: string }[],
): GiftWithStock[] {
  const map = new Map(stock.map((s) => [s.gift_id, s]));
  return gifts.map((g) => {
    const s = map.get(g.id);
    return {
      ...g,
      price: Number(g.price),
      remaining: s ? s.remaining : g.quantity,
      stock_status: (s?.status as GiftWithStock["stock_status"]) ?? "AVAILABLE",
    };
  });
}

export function isPixConfigured(s: WeddingSettings): boolean {
  return Boolean(s.pix_key_type && s.pix_key && s.pix_beneficiary && s.pix_city);
}

/** Dados públicos do site (somente conteúdo publicado), via cliente anônimo + RLS. */
export async function getPublicSiteData(): Promise<SiteData> {
  if (!isSupabaseConfigured) return fallbackSiteData();
  const db = createPublicClient();
  const [settingsRes, themeRes, sectionsRes, photosRes, giftsRes, stockRes, messagesRes] = await Promise.all([
    db.from("wedding_settings").select(PUBLIC_SETTINGS_COLUMNS).eq("id", 1).maybeSingle(),
    db.rpc("public_theme"),
    db.rpc("public_site_sections"),
    db.from("photos").select("*").order("position"),
    db.from("gifts").select("*").eq("active", true).order("position"),
    db.rpc("public_gift_stock"),
    db
      .from("messages")
      .select("id,name,message,created_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(60),
  ]);

  if (settingsRes.error || !settingsRes.data) {
    console.error("Falha ao carregar configurações", settingsRes.error?.message);
    return fallbackSiteData();
  }
  const settings = settingsRes.data as unknown as WeddingSettings;
  const theme = themeTokensSchema.safeParse(themeRes.data);
  const sections = ((sectionsRes.data ?? []) as RawSection[]).map((s) => toSection(s)).filter(Boolean) as Section[];
  const photos = (photosRes.data ?? []) as Photo[];

  return {
    settings,
    theme: theme.success ? theme.data : DEFAULT_THEME.tokens,
    sections,
    photos: Object.fromEntries(photos.map((p) => [p.id, p])),
    gallery: photos.filter((p) => p.album === "gallery"),
    gifts: mergeStock((giftsRes.data ?? []) as Gift[], stockRes.data ?? []),
    messages: messagesRes.data ?? [],
    pixEnabled: isPixConfigured(settings),
  };
}

/** Conteúdo protegido de uma seção (manual dos padrinhos), lido apenas no servidor. */
export async function getProtectedSection(key: SectionKey): Promise<Section | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await createServiceClient()
    .from("wedding_sections")
    .select("key,position,enabled,show_in_nav,nav_label,is_protected,content")
    .eq("key", key)
    .maybeSingle();
  return data ? toSection(data as RawSection) : null;
}
