import type { Section, SectionContentMap, SectionKey } from "@/lib/content/schemas";
import type { SiteData } from "@/lib/types";
import { themeToCssVars } from "@/lib/themes/css";
import { formatDate } from "@/lib/format";
import { Nav, type NavItem } from "./Nav";
import { Hero } from "./Hero";
import { Story } from "./Story";
import { Details } from "./Details";
import { Location } from "./Location";
import { SectionShell } from "./SectionShell";
import { PhotoViewer } from "./PhotoViewer";
import { Countdown } from "./Countdown";
import { GodparentsManual, GodparentsTeaser } from "./Godparents";
import { DressCode } from "./DressCode";
import { Gifts } from "./Gifts";
import { Rsvp } from "./Rsvp";
import { Messages } from "./Messages";
import { Faq } from "./Faq";
import { Ornament } from "./Ornament";
import { Reveal } from "./Reveal";

export const SECTION_ANCHORS: Record<SectionKey, string> = {
  hero: "inicio",
  story: "historia",
  countdown: "contagem",
  details: "casamento",
  location: "localizacao",
  gallery: "galeria",
  godparents: "padrinhos",
  dresscode: "dresscode",
  gifts: "presentes",
  rsvp: "rsvp",
  messages: "recados",
  faq: "informacoes",
};

type Props = { data: SiteData; preview?: boolean };

function get<K extends SectionKey>(sections: Section[], key: K) {
  return sections.find((s) => s.key === key) as Section<K> | undefined;
}

/** Renderiza o site inteiro a partir dos dados (usado no site público e na pré-visualização). */
export function SiteRenderer({ data, preview = false }: Props) {
  const { settings, theme, photos } = data;
  const deco = theme.decoration;
  const sections = data.sections.filter((s) => s.enabled).sort((a, b) => a.position - b.position);
  const countdownContent = (get(data.sections, "countdown")?.content ?? { title: "", afterMessage: "" }) as SectionContentMap["countdown"];

  const navItems: NavItem[] = sections
    .filter((s) => s.show_in_nav && s.nav_label)
    .map((s) => ({ href: `#${SECTION_ANCHORS[s.key]}`, label: s.nav_label }));

  const first = sections.find((s) => s.key !== "hero");
  const nextHref = first ? `#${SECTION_ANCHORS[first.key]}` : "#inicio";
  const monogram = `${settings.partner1_name.charAt(0)}&${settings.partner2_name.charAt(0)}`;

  const render = (s: Section) => {
    switch (s.key) {
      case "hero": {
        const c = s.content as SectionContentMap["hero"];
        return (
          <Hero
            key={s.key}
            content={c}
            settings={settings}
            photo={c.photoId ? photos[c.photoId] : undefined}
            decoration={deco}
            countdownAfter={countdownContent.afterMessage}
            nextHref={nextHref}
          />
        );
      }
      case "story":
        return <Story key={s.key} content={s.content as SectionContentMap["story"]} photos={photos} decoration={deco} />;
      case "countdown": {
        const c = s.content as SectionContentMap["countdown"];
        return (
          <section key={s.key} id="contagem" className="scroll-mt-20 px-5 py-20 text-center sm:px-8">
            <Reveal className="mx-auto max-w-3xl">
              {c.title && <h2 className="heading-md mb-8">{c.title}</h2>}
              <div className="flex justify-center">
                <Countdown target={settings.wedding_at} afterMessage={c.afterMessage} variant="themed" />
              </div>
            </Reveal>
          </section>
        );
      }
      case "details":
        return <Details key={s.key} content={s.content as SectionContentMap["details"]} settings={settings} decoration={deco} />;
      case "location":
        return <Location key={s.key} content={s.content as SectionContentMap["location"]} settings={settings} decoration={deco} />;
      case "gallery": {
        const c = s.content as SectionContentMap["gallery"];
        return (
          <SectionShell key={s.key} id="galeria" eyebrow="Memórias" title={c.title} subtitle={c.subtitle} decoration={deco}>
            <PhotoViewer photos={data.gallery} layout={c.layout} emptyLabel="Em breve, nossas fotos favoritas." />
          </SectionShell>
        );
      }
      case "godparents": {
        const c = s.content as SectionContentMap["godparents"];
        return s.is_protected && !preview ? (
          <GodparentsTeaser key={s.key} title={c.title || "Manual dos padrinhos"} decoration={deco} />
        ) : (
          <GodparentsManual key={s.key} content={c} settings={settings} photos={photos} decoration={deco} />
        );
      }
      case "dresscode":
        return <DressCode key={s.key} content={s.content as SectionContentMap["dresscode"]} photos={photos} decoration={deco} />;
      case "gifts":
        return (
          <Gifts
            key={s.key}
            content={s.content as SectionContentMap["gifts"]}
            gifts={data.gifts}
            photos={photos}
            decoration={deco}
            pixEnabled={data.pixEnabled}
            preview={preview}
          />
        );
      case "rsvp":
        return <Rsvp key={s.key} content={s.content as SectionContentMap["rsvp"]} settings={settings} decoration={deco} preview={preview} />;
      case "messages":
        return (
          <Messages
            key={s.key}
            content={s.content as SectionContentMap["messages"]}
            messages={data.messages}
            decoration={deco}
            timezone={settings.timezone}
            preview={preview}
          />
        );
      case "faq":
        return <Faq key={s.key} content={s.content as SectionContentMap["faq"]} decoration={deco} />;
    }
  };

  return (
    <div className="site" style={themeToCssVars(theme)}>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-surface focus:px-4 focus:py-2">
        Pular para o conteúdo
      </a>
      <Nav items={navItems} monogram={monogram} />
      <main id="conteudo">{sections.map(render)}</main>
      <footer className="px-5 pb-12 pt-20 text-center">
        <Ornament decoration={deco} />
        <p className="font-heading mt-6 text-4xl">
          {settings.partner1_name} <span className="italic text-primary">&</span> {settings.partner2_name}
        </p>
        <p className="eyebrow mt-3">{formatDate(settings.wedding_at, settings.timezone)}</p>
        <p className="muted mt-10 text-xs">
          Feito com amor ·{" "}
          <a href="/privacidade" className="underline underline-offset-2">
            Privacidade
          </a>
        </p>
      </footer>
    </div>
  );
}
