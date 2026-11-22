import type { SectionContentMap, ThemeTokens } from "@/lib/content/schemas";
import type { WeddingSettings } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/format";
import { Paragraphs, SectionShell } from "./SectionShell";
import { Reveal } from "./Reveal";

type Props = { content: SectionContentMap["details"]; settings: WeddingSettings; decoration: ThemeTokens["decoration"] };

function Venue({ label, name, time, address, date }: { label: string; name: string; time: string; address: string; date: string }) {
  return (
    <div className="card hairline flex h-full flex-col items-center px-6 py-10 text-center sm:px-10">
      <p className="eyebrow">{label}</p>
      <h3 className="heading-md mt-4">{name}</h3>
      <div className="my-6 flex items-center gap-4 text-sm uppercase tracking-[0.2em]">
        <span>{date}</span>
        {time && (
          <>
            <span aria-hidden className="h-4 w-px bg-primary/40" />
            <span>{time}</span>
          </>
        )}
      </div>
      {address && <p className="muted max-w-xs text-sm leading-6">{address}</p>}
    </div>
  );
}

export function Details({ content, settings, decoration }: Props) {
  const tz = settings.timezone;
  const date = formatDate(settings.wedding_at, tz, { day: "2-digit", month: "2-digit", year: "numeric" });
  const weekday = formatDate(settings.wedding_at, tz, { weekday: "long" });
  const ceremonyTime = settings.ceremony_time || formatTime(settings.wedding_at, tz);
  const hasReception = Boolean(settings.reception_name || settings.reception_address);

  return (
    <SectionShell id="casamento" eyebrow="Save the date" title={content.title} subtitle={content.subtitle} decoration={decoration} tone="tint">
      <Reveal className="mb-12 text-center">
        <p className="font-heading text-2xl italic first-letter:uppercase md:text-3xl">{weekday}</p>
        <p className="font-heading text-5xl md:text-7xl">{formatDate(settings.wedding_at, tz, { day: "2-digit", month: "long" })}</p>
        <p className="eyebrow mt-3">{formatDate(settings.wedding_at, tz, { year: "numeric" })}</p>
      </Reveal>

      <div className={`mx-auto grid max-w-4xl gap-6 ${hasReception ? "md:grid-cols-2" : "max-w-xl"}`}>
        <Reveal>
          <Venue label="Cerimônia" name={settings.ceremony_name || "Cerimônia"} time={ceremonyTime} address={settings.ceremony_address} date={date} />
        </Reveal>
        {hasReception && (
          <Reveal delay={120}>
            <Venue label="Recepção" name={settings.reception_name || "Recepção"} time={settings.reception_time} address={settings.reception_address} date={date} />
          </Reveal>
        )}
      </div>

      {content.extraInfo && (
        <Reveal className="mx-auto mt-12 max-w-2xl text-center">
          <Paragraphs text={content.extraInfo} className="muted" />
        </Reveal>
      )}
    </SectionShell>
  );
}
