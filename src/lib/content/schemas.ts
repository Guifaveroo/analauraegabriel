import { z } from "zod";

// Utilitários --------------------------------------------------------------
export const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use o formato #RRGGBB");
const text = (max: number) => z.string().max(max).default("");
const id = z.string().min(1).max(64);
const photoId = z.string().uuid().nullable().default(null);
const photoIds = z.array(z.string().uuid()).max(30).default([]);

// Tema --------------------------------------------------------------------
export const HEADING_FONTS = [
  "cormorant",
  "playfair",
  "baskerville",
  "marcellus",
  "cinzel",
  "greatvibes",
] as const;
export const BODY_FONTS = ["inter", "montserrat", "lato", "josefin", "raleway", "nunito"] as const;
export const DECORATIONS = ["none", "floral", "leaves", "minimal", "rustic", "boho", "geometric"] as const;
export const BUTTON_STYLES = ["rounded", "pill", "square"] as const;

export const themeTokensSchema = z.object({
  primary: hexColor,
  secondary: hexColor,
  background: hexColor,
  surface: hexColor,
  text: hexColor,
  button: hexColor,
  buttonText: hexColor,
  headingFont: z.enum(HEADING_FONTS),
  bodyFont: z.enum(BODY_FONTS),
  buttonStyle: z.enum(BUTTON_STYLES),
  decoration: z.enum(DECORATIONS),
});
export type ThemeTokens = z.infer<typeof themeTokensSchema>;

// Seções ------------------------------------------------------------------
export const SECTION_KEYS = [
  "hero",
  "story",
  "countdown",
  "details",
  "location",
  "gallery",
  "godparents",
  "dresscode",
  "gifts",
  "rsvp",
  "messages",
  "faq",
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export const heroSchema = z.object({
  tagline: text(200),
  photoId,
  focalX: z.number().min(0).max(100).default(50),
  focalY: z.number().min(0).max(100).default(50),
  overlay: z.number().min(0).max(80).default(35),
  ctaLabel: text(40),
  showCountdown: z.boolean().default(true),
});

export const storySchema = z.object({
  title: text(120),
  subtitle: text(200),
  intro: text(3000),
  events: z
    .array(
      z.object({
        id,
        date: text(60),
        title: text(120),
        text: text(1500),
        photoId,
      }),
    )
    .max(20)
    .default([]),
});

export const countdownSchema = z.object({
  title: text(120),
  afterMessage: text(500),
});

export const detailsSchema = z.object({
  title: text(120),
  subtitle: text(200),
  extraInfo: text(2000),
});

export const locationSchema = z.object({
  title: text(120),
  subtitle: text(200),
  parking: text(1000),
  access: text(1000),
  showReceptionMap: z.boolean().default(true),
});

export const gallerySchema = z.object({
  title: text(120),
  subtitle: text(200),
  layout: z.enum(["grid", "carousel"]).default("grid"),
});

export const godparentsSchema = z.object({
  title: text(120),
  welcome: text(3000),
  ceremony: text(3000),
  schedule: z
    .array(z.object({ id, time: text(20), label: text(160) }))
    .max(20)
    .default([]),
  dressCode: text(2000),
  palette: z.array(hexColor).max(12).default([]),
  groomsmen: text(2000),
  bridesmaids: text(2000),
  beauty: text(2000),
  photoIds,
});

export const dresscodeSchema = z.object({
  title: text(120),
  formality: text(120),
  guidelines: text(2000),
  suggestedColors: z.array(hexColor).max(12).default([]),
  avoidColors: z.array(hexColor).max(12).default([]),
  photoIds,
});

export const giftsSchema = z.object({
  title: text(120),
  subtitle: text(200),
  intro: text(1500),
  thankYou: text(500),
});

export const rsvpSchema = z.object({
  title: text(120),
  subtitle: text(300),
  thankYou: text(500),
});

export const messagesSchema = z.object({
  title: text(120),
  subtitle: text(300),
});

export const faqSchema = z.object({
  title: text(120),
  items: z
    .array(z.object({ id, question: text(200), answer: text(2000) }))
    .max(40)
    .default([]),
});

export const sectionContentSchemas = {
  hero: heroSchema,
  story: storySchema,
  countdown: countdownSchema,
  details: detailsSchema,
  location: locationSchema,
  gallery: gallerySchema,
  godparents: godparentsSchema,
  dresscode: dresscodeSchema,
  gifts: giftsSchema,
  rsvp: rsvpSchema,
  messages: messagesSchema,
  faq: faqSchema,
} satisfies Record<SectionKey, z.ZodTypeAny>;

export type SectionContentMap = {
  [K in SectionKey]: z.infer<(typeof sectionContentSchemas)[K]>;
};

export type SectionMeta = {
  key: SectionKey;
  position: number;
  enabled: boolean;
  show_in_nav: boolean;
  nav_label: string;
  is_protected: boolean;
};

export type Section<K extends SectionKey = SectionKey> = SectionMeta & {
  key: K;
  content: SectionContentMap[K];
};

/** Lê conteúdo do banco de forma tolerante: campos ausentes recebem valores padrão. */
export function parseSectionContent<K extends SectionKey>(key: K, raw: unknown): SectionContentMap[K] {
  const schema = sectionContentSchemas[key];
  const result = schema.safeParse(raw ?? {});
  if (result.success) return result.data as SectionContentMap[K];
  return schema.parse({}) as SectionContentMap[K];
}
