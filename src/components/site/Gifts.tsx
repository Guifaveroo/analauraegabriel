"use client";

import { useMemo, useState } from "react";
import type { SectionContentMap, ThemeTokens } from "@/lib/content/schemas";
import type { GiftWithStock, Photo } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { photoSources } from "@/lib/photos";
import { SectionShell, Paragraphs } from "./SectionShell";
import { Reveal } from "./Reveal";
import { PixCheckout } from "./PixCheckout";

type Props = {
  content: SectionContentMap["gifts"];
  gifts: GiftWithStock[];
  photos: Record<string, Photo>;
  decoration: ThemeTokens["decoration"];
  pixEnabled: boolean;
  preview?: boolean;
};

function availabilityLabel(g: GiftWithStock): string | null {
  if (g.stock_status !== "AVAILABLE") return g.stock_status === "PAID" ? "Presenteado" : "Reservado";
  if (g.mode === "limited" && g.remaining !== null) return g.remaining === 1 ? "Última unidade" : `${g.remaining} disponíveis`;
  if (g.mode === "unlimited") return "Aceita várias contribuições";
  return null;
}

export function Gifts({ content, gifts, photos, decoration, pixEnabled, preview }: Props) {
  const categories = useMemo(() => Array.from(new Set(gifts.map((g) => g.category).filter(Boolean))), [gifts]);
  const [category, setCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<GiftWithStock | null>(null);
  const visible = category ? gifts.filter((g) => g.category === category) : gifts;

  return (
    <SectionShell id="presentes" eyebrow="Com carinho" title={content.title} subtitle={content.subtitle} decoration={decoration} tone="tint">
      {content.intro && (
        <Reveal className="mx-auto -mt-4 mb-10 max-w-2xl text-center">
          <Paragraphs text={content.intro} className="muted" />
        </Reveal>
      )}

      {categories.length > 1 && (
        <div className="scrollbar-none -mx-5 mb-10 flex gap-2 overflow-x-auto px-5 sm:justify-center">
          {[null, ...categories].map((c) => (
            <button
              key={c ?? "all"}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`min-h-10 shrink-0 rounded-full border px-5 text-xs uppercase tracking-[0.16em] transition ${
                category === c ? "border-primary bg-primary text-white" : "border-primary/30 hover:border-primary"
              }`}
            >
              {c ?? "Todos"}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="muted text-center">Em breve nossa lista estará disponível.</p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {visible.map((g, i) => {
            const photo = g.photo_id ? photos[g.photo_id] : undefined;
            const src = photo ? photoSources(photo) : null;
            const available = g.stock_status === "AVAILABLE";
            const label = availabilityLabel(g);
            return (
              <li key={g.id}>
                <Reveal delay={(i % 3) * 80} className="h-full">
                  <article className={`card group flex h-full flex-col overflow-hidden ${available ? "" : "opacity-70"}`}>
                    <div className="relative aspect-[4/3] overflow-hidden bg-secondary/20">
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={src.thumb}
                          srcSet={src.srcSet}
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          alt={g.name}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center font-heading text-5xl text-primary/40" aria-hidden>
                          ❦
                        </div>
                      )}
                      {label && (
                        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-ink">
                          {label}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      {g.category && <p className="eyebrow mb-2 !text-[0.62rem]">{g.category}</p>}
                      <h3 className="font-heading text-2xl">{g.name}</h3>
                      {g.description && <p className="muted mt-2 flex-1 text-sm leading-6">{g.description}</p>}
                      <div className="mt-5 flex items-center justify-between gap-4">
                        <span className="font-heading text-2xl text-primary">{formatCurrency(g.price)}</span>
                        <button
                          type="button"
                          className="btn !min-h-11 !px-5"
                          disabled={!available || !pixEnabled}
                          onClick={() => setSelected(g)}
                        >
                          {available ? "Presentear" : "Indisponível"}
                        </button>
                      </div>
                    </div>
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ul>
      )}

      {!pixEnabled && gifts.length > 0 && (
        <p className="muted mt-8 text-center text-xs">Os pagamentos via PIX serão liberados em breve.</p>
      )}

      {selected && (
        <PixCheckout
          gift={selected}
          photo={selected.photo_id ? photos[selected.photo_id] : undefined}
          thankYou={content.thankYou}
          preview={preview}
          onClose={() => setSelected(null)}
        />
      )}
    </SectionShell>
  );
}
