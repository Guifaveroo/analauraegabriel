import type { SectionContentMap, ThemeTokens } from "@/lib/content/schemas";
import type { Photo, WeddingSettings } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { Paragraphs, SectionShell } from "./SectionShell";
import { PhotoViewer } from "./PhotoViewer";
import { Reveal } from "./Reveal";
import { Swatches } from "./DressCode";

type Props = {
  content: SectionContentMap["godparents"];
  settings: WeddingSettings;
  photos: Record<string, Photo>;
  decoration: ThemeTokens["decoration"];
};

function Block({ title, text }: { title: string; text: string }) {
  if (!text) return null;
  return (
    <Reveal className="card hairline p-6 sm:p-8">
      <h3 className="font-heading text-2xl">{title}</h3>
      <Paragraphs text={text} className="muted mt-3 text-sm leading-7 sm:text-base" />
    </Reveal>
  );
}

/** Conteúdo completo do manual (usado na página principal ou em /padrinhos). */
export function GodparentsManual({ content, settings, photos, decoration }: Props) {
  const refs = content.photoIds.map((id) => photos[id]).filter(Boolean);
  const place = [settings.ceremony_name, settings.ceremony_address].filter(Boolean).join(" — ");

  return (
    <SectionShell id="padrinhos" eyebrow="Para vocês, com carinho" title={content.title} decoration={decoration} tone="tint">
      {content.welcome && (
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <Paragraphs text={content.welcome} className="font-heading text-xl italic leading-relaxed md:text-2xl" />
        </Reveal>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Reveal className="card hairline p-6 sm:p-8 lg:row-span-2">
          <h3 className="font-heading text-2xl">Horários</h3>
          <p className="muted mt-1 text-sm">{formatDate(settings.wedding_at, settings.timezone)}</p>
          <ol className="mt-6 space-y-5">
            {content.schedule.map((s) => (
              <li key={s.id} className="flex gap-4">
                <span className="w-14 shrink-0 font-heading text-xl text-primary">{s.time}</span>
                <span className="text-sm leading-6">{s.label}</span>
              </li>
            ))}
          </ol>
          {place && (
            <div className="mt-8 border-t hairline pt-6">
              <p className="eyebrow">Local</p>
              <p className="mt-2 text-sm leading-6">{place}</p>
              <a href="#localizacao" className="mt-3 inline-block text-sm text-primary underline underline-offset-4">
                Ver no mapa
              </a>
            </div>
          )}
        </Reveal>
        <div className="grid gap-6 lg:col-span-2 sm:grid-cols-2">
          <Block title="A cerimônia" text={content.ceremony} />
          <Reveal className="card hairline p-6 sm:p-8">
            <h3 className="font-heading text-2xl">Dress code</h3>
            <Paragraphs text={content.dressCode} className="muted mt-3 text-sm leading-7" />
            {content.palette.length > 0 && (
              <div className="mt-5">
                <p className="eyebrow mb-3">Paleta de cores</p>
                <Swatches colors={content.palette} />
              </div>
            )}
          </Reveal>
          <Block title="Padrinhos" text={content.groomsmen} />
          <Block title="Madrinhas" text={content.bridesmaids} />
        </div>
        <div className="lg:col-span-3">
          <Block title="Cabelo e maquiagem" text={content.beauty} />
        </div>
      </div>

      {refs.length > 0 && (
        <div className="mt-14">
          <p className="eyebrow mb-6 text-center">Referências</p>
          <PhotoViewer photos={refs} layout="strip" />
        </div>
      )}
    </SectionShell>
  );
}

/** Chamada para o manual quando ele está protegido por senha. */
export function GodparentsTeaser({ title, decoration }: { title: string; decoration: ThemeTokens["decoration"] }) {
  return (
    <SectionShell id="padrinhos" eyebrow="Padrinhos e madrinhas" title={title} decoration={decoration} tone="tint">
      <Reveal className="card hairline mx-auto max-w-xl p-8 text-center sm:p-12">
        <p className="muted leading-7">
          Preparamos um manual especial com horários, orientações e referências de trajes. O acesso é exclusivo para nossos
          padrinhos e madrinhas.
        </p>
        <a href="/padrinhos" className="btn mt-8">
          Acessar o manual
        </a>
      </Reveal>
    </SectionShell>
  );
}
