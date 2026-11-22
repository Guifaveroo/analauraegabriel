import type { SectionContentMap, ThemeTokens } from "@/lib/content/schemas";
import type { Photo, WeddingSettings } from "@/lib/types";
import { photoSources } from "@/lib/photos";
import { formatDate } from "@/lib/format";
import { Countdown } from "./Countdown";
import { CornerSprig } from "./Ornament";

type Props = {
  content: SectionContentMap["hero"];
  settings: WeddingSettings;
  photo: Photo | undefined;
  decoration: ThemeTokens["decoration"];
  countdownAfter: string;
  nextHref: string;
};

export function Hero({ content, settings, photo, decoration, countdownAfter, nextHref }: Props) {
  const src = photo ? photoSources(photo) : null;
  const date = formatDate(settings.wedding_at, settings.timezone);

  return (
    <section id="inicio" className="relative flex min-h-[100svh] items-center justify-center overflow-hidden text-white">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src.src}
          srcSet={src.srcSet}
          sizes="100vw"
          alt={photo?.caption || `${settings.partner1_name} e ${settings.partner2_name}`}
          fetchPriority="high"
          className="animate-slow-zoom absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: `${content.focalX}% ${content.focalY}%` }}
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 10%, color-mix(in srgb, var(--c-secondary) 70%, #fff) 0%, var(--c-primary) 70%, color-mix(in srgb, var(--c-primary) 60%, #000) 100%)",
          }}
        />
      )}
      <div aria-hidden className="absolute inset-0 bg-black" style={{ opacity: content.overlay / 100 }} />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/40 to-transparent" />

      <CornerSprig decoration={decoration} className="absolute -left-6 bottom-0 h-56 w-56 !text-white/50 md:h-80 md:w-80" />
      <CornerSprig decoration={decoration} className="absolute -right-6 top-14 h-48 w-48 -scale-x-100 rotate-180 !text-white/40 md:h-72 md:w-72" />

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 pb-20 pt-28 text-center">
        <p className="animate-fade-up text-[0.7rem] uppercase tracking-[0.42em] text-white/85">Vamos nos casar</p>
        <h1 className="heading-xl animate-fade-up mt-6 [animation-delay:150ms]">
          {settings.partner1_name}
          <span className="mx-3 inline-block font-heading italic opacity-90 md:mx-5">&</span>
          {settings.partner2_name}
        </h1>
        <p className="animate-fade-up mt-6 text-sm uppercase tracking-[0.35em] text-white/90 [animation-delay:300ms] md:text-base">
          {date}
        </p>
        {content.tagline && (
          <p className="animate-fade-up mx-auto mt-6 max-w-xl font-heading text-xl italic leading-relaxed text-white/90 [animation-delay:450ms] md:text-2xl">
            {content.tagline}
          </p>
        )}
        {content.showCountdown && (
          <div className="animate-fade-up mt-10 [animation-delay:600ms]">
            <Countdown target={settings.wedding_at} afterMessage={countdownAfter} />
          </div>
        )}
        {content.ctaLabel && (
          <a href={nextHref} className="btn btn-light animate-fade-up mt-10 [animation-delay:750ms]">
            {content.ctaLabel}
          </a>
        )}
      </div>

      <a href={nextHref} aria-label="Rolar para o conteúdo" className="animate-float absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-white/80">
        <svg width="22" height="34" viewBox="0 0 22 34" fill="none" stroke="currentColor" strokeWidth="1.2">
          <rect x="1" y="1" width="20" height="32" rx="10" />
          <path d="M11 8v6" strokeLinecap="round" />
        </svg>
      </a>
    </section>
  );
}
