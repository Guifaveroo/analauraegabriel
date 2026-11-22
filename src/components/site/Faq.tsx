import type { SectionContentMap, ThemeTokens } from "@/lib/content/schemas";
import { Paragraphs, SectionShell } from "./SectionShell";
import { Reveal } from "./Reveal";

export function Faq({ content, decoration }: { content: SectionContentMap["faq"]; decoration: ThemeTokens["decoration"] }) {
  return (
    <SectionShell id="informacoes" eyebrow="Dúvidas" title={content.title} decoration={decoration}>
      <Reveal className="mx-auto max-w-3xl divide-y hairline border-y">
        {content.items.map((item) => (
          <details key={item.id} className="group py-1">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-4 font-heading text-xl [&::-webkit-details-marker]:hidden">
              {item.question}
              <span aria-hidden className="text-2xl text-primary transition duration-300 group-open:rotate-45">
                +
              </span>
            </summary>
            <Paragraphs text={item.answer} className="muted pb-6 pr-10 text-sm leading-7 sm:text-base" />
          </details>
        ))}
      </Reveal>
    </SectionShell>
  );
}
