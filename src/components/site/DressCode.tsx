import type { SectionContentMap, ThemeTokens } from "@/lib/content/schemas";
import type { Photo } from "@/lib/types";
import { Paragraphs, SectionShell } from "./SectionShell";
import { PhotoViewer } from "./PhotoViewer";
import { Reveal } from "./Reveal";

export function Swatches({ colors, crossed = false }: { colors: string[]; crossed?: boolean }) {
  return (
    <ul className="flex flex-wrap gap-3">
      {colors.map((c) => (
        <li key={c} className="relative">
          <span
            className="block h-11 w-11 rounded-full border border-black/10 shadow-inner"
            style={{ background: c }}
            title={c}
            aria-label={`Cor ${c}`}
          />
          {crossed && (
            <span aria-hidden className="absolute left-1/2 top-1/2 h-px w-12 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-red-700/70" />
          )}
        </li>
      ))}
    </ul>
  );
}

type Props = { content: SectionContentMap["dresscode"]; photos: Record<string, Photo>; decoration: ThemeTokens["decoration"] };

export function DressCode({ content, photos, decoration }: Props) {
  const refs = content.photoIds.map((id) => photos[id]).filter(Boolean);
  return (
    <SectionShell id="dresscode" eyebrow="Como se vestir" title={content.title} decoration={decoration}>
      <div className="mx-auto grid max-w-5xl items-start gap-10 md:grid-cols-2">
        <Reveal>
          {content.formality && (
            <p className="font-heading text-3xl italic text-primary md:text-4xl">{content.formality}</p>
          )}
          <Paragraphs text={content.guidelines} className="muted mt-5 leading-7" />
        </Reveal>
        <Reveal delay={100} className="space-y-8">
          {content.suggestedColors.length > 0 && (
            <div>
              <p className="eyebrow mb-3">Cores sugeridas</p>
              <Swatches colors={content.suggestedColors} />
            </div>
          )}
          {content.avoidColors.length > 0 && (
            <div>
              <p className="eyebrow mb-3">Evite</p>
              <Swatches colors={content.avoidColors} crossed />
            </div>
          )}
        </Reveal>
      </div>
      {refs.length > 0 && (
        <div className="mt-14">
          <PhotoViewer photos={refs} layout="strip" />
        </div>
      )}
    </SectionShell>
  );
}
