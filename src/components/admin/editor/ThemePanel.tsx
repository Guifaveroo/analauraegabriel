"use client";

import { BODY_FONTS, BUTTON_STYLES, DECORATIONS, HEADING_FONTS, type ThemeTokens } from "@/lib/content/schemas";
import { THEME_PRESETS } from "@/lib/themes/presets";
import { FONT_LABELS } from "@/lib/themes/css";
import { ColorField } from "./fields";

const DECORATION_LABELS: Record<ThemeTokens["decoration"], string> = {
  none: "Sem ornamentos",
  minimal: "Minimalista",
  floral: "Floral delicado",
  leaves: "Folhagens",
  rustic: "Rústico",
  boho: "Boho (pampas)",
  geometric: "Geométrico",
};
const BUTTON_LABELS: Record<ThemeTokens["buttonStyle"], string> = { square: "Retos", rounded: "Arredondados", pill: "Cápsula" };

const COLOR_FIELDS: [keyof ThemeTokens, string][] = [
  ["primary", "Cor principal"],
  ["secondary", "Cor secundária"],
  ["background", "Cor de fundo"],
  ["surface", "Fundo dos cartões"],
  ["text", "Cor dos textos"],
  ["button", "Cor dos botões"],
  ["buttonText", "Texto dos botões"],
];

type Props = {
  theme: ThemeTokens;
  basePreset: string;
  onChange: (theme: ThemeTokens, basePreset?: string) => void;
};

export function ThemePanel({ theme, basePreset, onChange }: Props) {
  const set = (patch: Partial<ThemeTokens>) => onChange({ ...theme, ...patch });

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-1 text-sm font-semibold">Temas prontos</h3>
        <p className="mb-3 text-xs text-stone-500">Trocar o tema muda apenas cores, fontes e ornamentos — seus textos e fotos são mantidos.</p>
        <div className="grid grid-cols-2 gap-2">
          {THEME_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.tokens, p.id)}
              className={`rounded-xl border p-3 text-left transition hover:border-stone-500 ${basePreset === p.id ? "border-stone-900 ring-1 ring-stone-900" : "border-stone-200"}`}
              style={{ background: p.tokens.background }}
            >
              <span className="flex gap-1">
                {[p.tokens.primary, p.tokens.secondary, p.tokens.text].map((c) => (
                  <span key={c} className="h-4 w-4 rounded-full border border-black/10" style={{ background: c }} />
                ))}
              </span>
              <span className="mt-2 block text-lg leading-tight" style={{ fontFamily: `var(--font-${p.tokens.headingFont})`, color: p.tokens.text }}>
                {p.name}
              </span>
              <span className="mt-1 block text-[0.7rem] leading-4" style={{ color: p.tokens.text, opacity: 0.7 }}>{p.description}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold">Cores</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {COLOR_FIELDS.map(([key, label]) => (
            <ColorField key={key} label={label} value={theme[key] as string} onChange={(v) => set({ [key]: v } as Partial<ThemeTokens>)} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold">Tipografia</h3>
        <div>
          <label htmlFor="font-heading" className="admin-label">Fonte dos títulos</label>
          <select id="font-heading" className="admin-input" value={theme.headingFont} onChange={(e) => set({ headingFont: e.target.value as ThemeTokens["headingFont"] })}>
            {HEADING_FONTS.map((f) => <option key={f} value={f}>{FONT_LABELS[f]}</option>)}
          </select>
          <p className="mt-2 truncate text-3xl" style={{ fontFamily: `var(--font-${theme.headingFont})` }}>Ana &amp; Laura</p>
        </div>
        <div>
          <label htmlFor="font-body" className="admin-label">Fonte dos textos</label>
          <select id="font-body" className="admin-input" value={theme.bodyFont} onChange={(e) => set({ bodyFont: e.target.value as ThemeTokens["bodyFont"] })}>
            {BODY_FONTS.map((f) => <option key={f} value={f}>{FONT_LABELS[f]}</option>)}
          </select>
          <p className="mt-2 text-sm" style={{ fontFamily: `var(--font-${theme.bodyFont})` }}>Com alegria, convidamos você para celebrar conosco.</p>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold">Botões e elementos decorativos</h3>
        <div>
          <p className="admin-label">Formato dos botões</p>
          <div className="grid grid-cols-3 gap-2">
            {BUTTON_STYLES.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => set({ buttonStyle: b })}
                className={`min-h-10 border text-xs font-semibold uppercase tracking-wider ${theme.buttonStyle === b ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 bg-white"}`}
                style={{ borderRadius: b === "pill" ? 999 : b === "rounded" ? 10 : 0 }}
              >
                {BUTTON_LABELS[b]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="decoration" className="admin-label">Ornamentos</label>
          <select id="decoration" className="admin-input" value={theme.decoration} onChange={(e) => set({ decoration: e.target.value as ThemeTokens["decoration"] })}>
            {DECORATIONS.map((d) => <option key={d} value={d}>{DECORATION_LABELS[d]}</option>)}
          </select>
        </div>
      </section>
    </div>
  );
}
