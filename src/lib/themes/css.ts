import type { CSSProperties } from "react";
import type { ThemeTokens } from "../content/schemas";

export const FONT_LABELS: Record<string, string> = {
  cormorant: "Cormorant Garamond",
  playfair: "Playfair Display",
  baskerville: "Libre Baskerville",
  marcellus: "Marcellus",
  cinzel: "Cinzel",
  greatvibes: "Great Vibes (manuscrita)",
  inter: "Inter",
  montserrat: "Montserrat",
  lato: "Lato",
  josefin: "Josefin Sans",
  raleway: "Raleway",
  nunito: "Nunito Sans",
};

const RADIUS: Record<ThemeTokens["buttonStyle"], string> = { rounded: "0.6rem", pill: "999px", square: "0px" };

/** Converte os tokens do tema em variáveis CSS aplicadas ao contêiner do site. */
export function themeToCssVars(t: ThemeTokens): CSSProperties {
  return {
    "--c-primary": t.primary,
    "--c-secondary": t.secondary,
    "--c-bg": t.background,
    "--c-surface": t.surface,
    "--c-text": t.text,
    "--c-button": t.button,
    "--c-button-text": t.buttonText,
    "--font-heading": `var(--font-${t.headingFont})`,
    "--font-body": `var(--font-${t.bodyFont})`,
    "--radius-btn": RADIUS[t.buttonStyle],
    // fontes manuscritas precisam de tamanho maior para manter a legibilidade
    "--heading-scale": t.headingFont === "greatvibes" ? "1.25" : "1",
    "--heading-tracking": t.headingFont === "cinzel" || t.headingFont === "marcellus" ? "0.04em" : "0",
  } as CSSProperties;
}
