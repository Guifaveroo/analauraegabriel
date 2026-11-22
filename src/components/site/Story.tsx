import type { SectionContentMap, ThemeTokens } from "@/lib/content/schemas";
import type { Photo } from "@/lib/types";
import { photoSources } from "@/lib/photos";
import { Paragraphs, SectionShell } from "./SectionShell";
import { Reveal } from "./Reveal";

type Props = {
  content: SectionContentMap["story"];
  photos: Record<string, Photo>;
  decoration: ThemeTokens["decoration"];
};

export function Story({ content, photos, decoration }: Props) {
  return (
    <SectionShell id="historia" eyebrow="Nós dois" title={content.title} subtitle={content.subtitle} decoration={decoration}>
      {content.intro && (
        <Reveal className="mx-auto mb-16 max-w-2xl text-center text-base leading-8 md:text-lg">
          <Paragraphs text={content.intro} className="muted" />
        </Reveal>
      )}

      <ol className="relative mx-auto max-w-4xl">
        <span aria-hidden className="absolute bottom-0 left-4 top-0 w-px bg-primary/25 md:left-1/2" />
        {content.events.map((ev, i) => {
          const photo = ev.photoId ? photos[ev.photoId] : undefined;
          const src = photo ? photoSources(photo) : null;
          const right = i % 2 === 1;
          return (
            <li key={ev.id} className="relative mb-14 pl-12 last:mb-0 md:mb-20 md:grid md:grid-cols-2 md:gap-16 md:pl-0">
              <span aria-hidden className="absolute left-4 top-2 h-3 w-3 -translate-x-1/2 rotate-45 border border-primary bg-bg md:left-1/2" />
              <Reveal className={`${right ? "md:col-start-2" : "md:text-right"}`}>
                {ev.date && <p className="eyebrow mb-2">{ev.date}</p>}
                <h3 className="heading-md">{ev.title}</h3>
                {ev.text && <p className="muted mt-3 whitespace-pre-line leading-7">{ev.text}</p>}
              </Reveal>
              {src && (
                <Reveal delay={120} className={`mt-5 md:mt-0 ${right ? "md:col-start-1 md:row-start-1" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src.thumb}
                    srcSet={src.srcSet}
                    sizes="(min-width: 768px) 420px, 90vw"
                    alt={photo?.caption || ev.title}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[4/3] w-full object-cover shadow-[0_24px_48px_-32px_rgba(0,0,0,0.5)]"
                  />
                </Reveal>
              )}
            </li>
          );
        })}
      </ol>
    </SectionShell>
  );
}
