import type { ReactNode } from "react";
import type { ThemeTokens } from "@/lib/content/schemas";
import { Ornament } from "./Ornament";
import { Reveal } from "./Reveal";

type Props = {
  id: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  decoration: ThemeTokens["decoration"];
  tone?: "plain" | "tint";
  children: ReactNode;
  className?: string;
};

export function SectionShell({ id, eyebrow, title, subtitle, decoration, tone = "plain", children, className = "" }: Props) {
  return (
    <section id={id} className={`scroll-mt-20 px-5 py-20 sm:px-8 md:py-28 ${tone === "tint" ? "tint" : ""} ${className}`}>
      <div className="mx-auto max-w-6xl">
        {(title || eyebrow) && (
          <Reveal className="mx-auto mb-12 max-w-2xl text-center md:mb-16">
            {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
            {title && <h2 className="heading-lg">{title}</h2>}
            <Ornament decoration={decoration} className="mt-6" />
            {subtitle && <p className="muted mt-5 text-base md:text-lg">{subtitle}</p>}
          </Reveal>
        )}
        {children}
      </div>
    </section>
  );
}

/** Texto com quebras de linha preservadas (conteúdo vindo do painel, sem HTML). */
export function Paragraphs({ text, className = "" }: { text: string; className?: string }) {
  if (!text) return null;
  return (
    <div className={`space-y-4 ${className}`}>
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );
}
