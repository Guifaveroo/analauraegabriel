"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Section, SectionKey, ThemeTokens } from "@/lib/content/schemas";
import type { Photo, SiteData } from "@/lib/types";
import { SECTION_ANCHORS } from "@/components/site/SiteRenderer";
import { discardDraft, publishSite, saveDraft, type DraftPayload } from "@/app/admin/actions/editor";
import type { PreviewMessage } from "@/app/admin/preview/PreviewFrame";
import type { AdminResult } from "../ActionForm";
import { SectionForm, SECTION_TITLES } from "./SectionForms";
import { ThemePanel } from "./ThemePanel";
import { TextField, Toggle } from "./fields";

type Tab = "conteudo" | "aparencia" | "secoes";
type Device = "desktop" | "tablet" | "mobile";
const DEVICE_WIDTH: Record<Device, number> = { desktop: 1280, tablet: 820, mobile: 390 };
const DEVICE_LABEL: Record<Device, string> = { desktop: "Computador", tablet: "Tablet", mobile: "Celular" };

type Props = {
  initialSections: Section[];
  initialTheme: ThemeTokens;
  initialPreset: string;
  photos: Photo[];
  hasDraft: boolean;
  initialTab: Tab;
};

export function Editor({ initialSections, initialTheme, initialPreset, photos, hasDraft, initialTab }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [sections, setSections] = useState(() => [...initialSections].sort((a, b) => a.position - b.position));
  const [theme, setTheme] = useState(initialTheme);
  const [preset, setPreset] = useState(initialPreset);
  const [activeKey, setActiveKey] = useState<SectionKey>("hero");
  const [device, setDevice] = useState<Device>("desktop");
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [dirty, setDirty] = useState(false);
  const [draftPending, setDraftPending] = useState(hasDraft);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const frameBox = useRef<HTMLDivElement>(null);
  const [boxWidth, setBoxWidth] = useState(800);
  const scrollTarget = useRef<string | undefined>(undefined);

  const photoMap = useMemo(() => Object.fromEntries(photos.map((p) => [p.id, p])), [photos]);
  const gallery = useMemo(() => photos.filter((p) => p.album === "gallery"), [photos]);

  // envia o estado atual para o iframe da pré-visualização
  const post = useCallback(() => {
    const msg: PreviewMessage = { type: "draft", sections, theme, photos: photoMap, gallery: gallery as SiteData["gallery"], scrollTo: scrollTarget.current };
    scrollTarget.current = undefined;
    iframeRef.current?.contentWindow?.postMessage(msg, window.location.origin);
  }, [sections, theme, photoMap, gallery]);

  useEffect(() => {
    post();
  }, [post]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data?.type === "preview-ready") post();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [post]);

  useEffect(() => {
    const el = frameBox.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setBoxWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const touch = () => {
    setDirty(true);
    setStatus(null);
  };

  const updateSection = (key: SectionKey, patch: Partial<Section>) => {
    setSections((list) => list.map((s) => (s.key === key ? ({ ...s, ...patch } as Section) : s)));
    touch();
  };

  const move = (index: number, dir: -1 | 1) => {
    setSections((list) => {
      const next = [...list];
      const [it] = next.splice(index, 1);
      next.splice(index + dir, 0, it);
      return next.map((s, i) => ({ ...s, position: i }) as Section);
    });
    touch();
  };

  const payload = (): DraftPayload => ({
    sections: sections.map((s, i) => ({ key: s.key, position: i, enabled: s.enabled, show_in_nav: s.show_in_nav, nav_label: s.nav_label, content: s.content })),
    theme,
    basePreset: preset,
  });

  const run = (fn: () => Promise<AdminResult>, after?: (ok: boolean) => void) =>
    start(async () => {
      const res: AdminResult = await fn().catch((e: unknown) => ({ ok: false, error: e instanceof Error ? e.message : "Erro" }));
      setStatus({ ok: res.ok, text: res.ok ? res.message ?? "Salvo ✓" : res.error ?? "Erro" });
      after?.(res.ok);
    });

  const active = sections.find((s) => s.key === activeKey)!;
  const width = DEVICE_WIDTH[device];
  const scale = Math.min(1, (boxWidth - 16) / width);

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100dvh-3.5rem)] flex-col sm:-mx-6 lg:-mx-10 lg:-my-10 lg:h-dvh">
      {/* barra de ações */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 bg-white px-4 py-3">
        <h1 className="mr-auto font-admin-serif text-2xl">Editar meu site</h1>
        <div className="flex rounded-lg bg-stone-100 p-1 lg:hidden">
          {(["edit", "preview"] as const).map((v) => (
            <button key={v} type="button" onClick={() => setMobileView(v)} className={`rounded-md px-3 py-1.5 text-sm ${mobileView === v ? "bg-white shadow-sm" : ""}`}>
              {v === "edit" ? "Editar" : "Visualizar"}
            </button>
          ))}
        </div>
        {status && <span role="status" className={`text-sm ${status.ok ? "text-emerald-700" : "text-red-700"}`}>{status.text}</span>}
        {!status && (dirty || draftPending) && <span className="text-xs text-amber-700">{dirty ? "Alterações não salvas" : "Rascunho não publicado"}</span>}
        {draftPending && !dirty && (
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            disabled={pending}
            onClick={() => window.confirm("Descartar o rascunho e voltar ao conteúdo publicado?") && run(discardDraft, (ok) => ok && window.location.reload())}
          >
            Descartar
          </button>
        )}
        <button type="button" className="admin-btn admin-btn-secondary" disabled={pending || !dirty} onClick={() => run(() => saveDraft(payload()), (ok) => { if (ok) { setDirty(false); setDraftPending(true); } })}>
          Salvar rascunho
        </button>
        <a href="/admin/preview" target="_blank" rel="noopener" className="admin-btn admin-btn-secondary hidden sm:inline-flex" title="Abrir a pré-visualização do rascunho salvo em nova aba">
          Visualizar ↗
        </a>
        <button
          type="button"
          className="admin-btn admin-btn-success"
          disabled={pending}
          onClick={() => run(() => publishSite(payload()), (ok) => { if (ok) { setDirty(false); setDraftPending(false); router.refresh(); } })}
        >
          {pending ? "Aguarde…" : "Publicar"}
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* painel de edição */}
        <div className={`w-full shrink-0 overflow-y-auto border-r border-stone-200 bg-white lg:block lg:w-[420px] ${mobileView === "edit" ? "block" : "hidden"}`}>
          <div className="sticky top-0 z-10 flex border-b border-stone-200 bg-white">
            {([["conteudo", "Conteúdo"], ["aparencia", "Aparência"], ["secoes", "Seções"]] as const).map(([v, l]) => (
              <button key={v} type="button" onClick={() => setTab(v)} className={`flex-1 border-b-2 py-3 text-sm font-medium ${tab === v ? "border-stone-900" : "border-transparent text-stone-500"}`}>
                {l}
              </button>
            ))}
          </div>

          <div className="p-4">
            {tab === "conteudo" && (
              <>
                <label htmlFor="section-select" className="admin-label">Seção</label>
                <select
                  id="section-select"
                  className="admin-input mb-5"
                  value={activeKey}
                  onChange={(e) => {
                    const k = e.target.value as SectionKey;
                    setActiveKey(k);
                    scrollTarget.current = SECTION_ANCHORS[k];
                    post();
                  }}
                >
                  {sections.map((s) => (
                    <option key={s.key} value={s.key}>
                      {SECTION_TITLES[s.key]}{s.enabled ? "" : " (oculta)"}
                    </option>
                  ))}
                </select>
                <SectionForm key={active.key} section={active} photos={photos} onChange={(content) => updateSection(active.key, { content })} />
              </>
            )}

            {tab === "aparencia" && (
              <ThemePanel
                theme={theme}
                basePreset={preset}
                onChange={(t, p) => {
                  setTheme(t);
                  if (p) setPreset(p);
                  touch();
                }}
              />
            )}

            {tab === "secoes" && (
              <div>
                <p className="mb-4 text-xs text-stone-500">Ative, desative, reordene e renomeie os itens do menu.</p>
                <ol className="space-y-2">
                  {sections.map((s, i) => (
                    <li key={s.key} className={`rounded-lg border p-3 ${s.enabled ? "border-stone-200" : "border-dashed border-stone-300 bg-stone-50"}`}>
                      <div className="flex items-center gap-2">
                        <span className="flex-1 text-sm font-semibold">{SECTION_TITLES[s.key]}</span>
                        <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="h-8 w-8 rounded hover:bg-stone-100 disabled:opacity-30" aria-label="Subir">↑</button>
                        <button type="button" disabled={i === sections.length - 1} onClick={() => move(i, 1)} className="h-8 w-8 rounded hover:bg-stone-100 disabled:opacity-30" aria-label="Descer">↓</button>
                      </div>
                      <Toggle label="Exibir no site" checked={s.enabled} onChange={(enabled) => updateSection(s.key, { enabled })} />
                      {s.enabled && s.key !== "hero" && (
                        <>
                          <Toggle label="Mostrar no menu" checked={s.show_in_nav} onChange={(show_in_nav) => updateSection(s.key, { show_in_nav })} />
                          {s.show_in_nav && <TextField label="Nome no menu" value={s.nav_label} max={40} onChange={(nav_label) => updateSection(s.key, { nav_label })} />}
                        </>
                      )}
                      {s.key === "hero" && s.enabled && (
                        <TextField label="Nome no menu" value={s.nav_label} max={40} onChange={(nav_label) => updateSection(s.key, { nav_label })} />
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* pré-visualização */}
        <div className={`min-w-0 flex-1 flex-col bg-stone-200/60 lg:flex ${mobileView === "preview" ? "flex" : "hidden"}`}>
          <div className="flex justify-center gap-1 py-2">
            {(Object.keys(DEVICE_WIDTH) as Device[]).map((d) => (
              <button key={d} type="button" onClick={() => setDevice(d)} className={`rounded-md px-3 py-1.5 text-xs font-medium ${device === d ? "bg-white shadow-sm" : "text-stone-600 hover:bg-white/60"}`}>
                {DEVICE_LABEL[d]}
              </button>
            ))}
          </div>
          <div ref={frameBox} className="relative min-h-0 flex-1 overflow-hidden px-2 pb-2">
            <div
              className="absolute left-1/2 top-0 overflow-hidden rounded-lg bg-white shadow-lg"
              style={{ width, height: `${100 / scale}%`, transform: `translateX(-50%) scale(${scale})`, transformOrigin: "top center" }}
            >
              <iframe ref={iframeRef} title="Pré-visualização do site" src="/admin/preview" className="h-full w-full border-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
