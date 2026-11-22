import type { SectionContentMap, ThemeTokens } from "@/lib/content/schemas";
import type { WeddingSettings } from "@/lib/types";
import { Paragraphs, SectionShell } from "./SectionShell";
import { Reveal } from "./Reveal";

type Props = { content: SectionContentMap["location"]; settings: WeddingSettings; decoration: ThemeTokens["decoration"] };

type Place = { label: string; name: string; address: string; lat: number | null; lng: number | null };

function links(p: Place) {
  const hasCoords = p.lat !== null && p.lng !== null;
  const query = hasCoords ? `${p.lat},${p.lng}` : `${p.name} ${p.address}`.trim();
  const q = encodeURIComponent(query);
  return {
    embed: `https://www.google.com/maps?q=${q}&output=embed`,
    google: `https://www.google.com/maps/search/?api=1&query=${q}`,
    waze: hasCoords ? `https://waze.com/ul?ll=${p.lat},${p.lng}&navigate=yes` : `https://waze.com/ul?q=${q}&navigate=yes`,
  };
}

function MapCard({ place }: { place: Place }) {
  const l = links(place);
  return (
    <div className="card hairline overflow-hidden">
      <div className="relative aspect-[4/3] w-full bg-secondary/20 sm:aspect-[16/10]">
        <iframe
          title={`Mapa — ${place.name || place.label}`}
          src={l.embed}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 h-full w-full border-0 grayscale-[30%]"
        />
      </div>
      <div className="p-6 sm:p-8">
        <p className="eyebrow">{place.label}</p>
        <h3 className="heading-md mt-2">{place.name}</h3>
        <p className="muted mt-2 text-sm leading-6">{place.address}</p>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <a href={l.google} target="_blank" rel="noopener noreferrer" className="btn">
            Google Maps
          </a>
          <a href={l.waze} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
            Waze
          </a>
        </div>
      </div>
    </div>
  );
}

export function Location({ content, settings, decoration }: Props) {
  const places: Place[] = [];
  if (settings.ceremony_address || settings.ceremony_lat !== null) {
    places.push({ label: "Cerimônia", name: settings.ceremony_name, address: settings.ceremony_address, lat: settings.ceremony_lat, lng: settings.ceremony_lng });
  }
  const sameAsCeremony = settings.reception_address && settings.reception_address === settings.ceremony_address;
  if (content.showReceptionMap && !sameAsCeremony && (settings.reception_address || settings.reception_lat !== null)) {
    places.push({ label: "Recepção", name: settings.reception_name, address: settings.reception_address, lat: settings.reception_lat, lng: settings.reception_lng });
  }

  return (
    <SectionShell id="localizacao" eyebrow="Localização" title={content.title} subtitle={content.subtitle} decoration={decoration}>
      <div className={`grid gap-8 ${places.length > 1 ? "lg:grid-cols-2" : "mx-auto max-w-3xl"}`}>
        {places.map((p, i) => (
          <Reveal key={p.label} delay={i * 120}>
            <MapCard place={p} />
          </Reveal>
        ))}
      </div>

      {(content.parking || content.access) && (
        <div className="mx-auto mt-12 grid max-w-4xl gap-8 md:grid-cols-2">
          {content.parking && (
            <Reveal className="border-l-2 border-primary/40 pl-5">
              <h3 className="font-heading text-xl">Estacionamento</h3>
              <Paragraphs text={content.parking} className="muted mt-2 text-sm leading-6" />
            </Reveal>
          )}
          {content.access && (
            <Reveal delay={100} className="border-l-2 border-primary/40 pl-5">
              <h3 className="font-heading text-xl">Acesso</h3>
              <Paragraphs text={content.access} className="muted mt-2 text-sm leading-6" />
            </Reveal>
          )}
        </div>
      )}
    </SectionShell>
  );
}
