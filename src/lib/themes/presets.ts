import type { ThemeTokens } from "../content/schemas";

export type ThemePreset = { id: string; name: string; description: string; tokens: ThemeTokens };

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "classic",
    name: "Clássico e elegante",
    description: "Marfim, dourado envelhecido e serifas clássicas.",
    tokens: {
      primary: "#8a6d3b",
      secondary: "#c9b48a",
      background: "#fbf8f2",
      surface: "#ffffff",
      text: "#2f2a24",
      button: "#8a6d3b",
      buttonText: "#ffffff",
      headingFont: "cormorant",
      bodyFont: "montserrat",
      buttonStyle: "square",
      decoration: "minimal",
    },
  },
  {
    id: "romantic",
    name: "Romântico floral",
    description: "Rosé suave, verde-sálvia e ramos florais delicados.",
    tokens: {
      primary: "#b56576",
      secondary: "#9bab8f",
      background: "#fdf6f4",
      surface: "#ffffff",
      text: "#43302e",
      button: "#b56576",
      buttonText: "#ffffff",
      headingFont: "playfair",
      bodyFont: "lato",
      buttonStyle: "pill",
      decoration: "floral",
    },
  },
  {
    id: "minimal",
    name: "Minimalista",
    description: "Preto e branco, muito respiro e tipografia limpa.",
    tokens: {
      primary: "#1f1f1f",
      secondary: "#9a9a9a",
      background: "#ffffff",
      surface: "#f6f6f4",
      text: "#1f1f1f",
      button: "#1f1f1f",
      buttonText: "#ffffff",
      headingFont: "marcellus",
      bodyFont: "inter",
      buttonStyle: "square",
      decoration: "none",
    },
  },
  {
    id: "rustic",
    name: "Rústico",
    description: "Terracota, madeira e folhagens naturais.",
    tokens: {
      primary: "#a0522d",
      secondary: "#6b7d4f",
      background: "#f6efe4",
      surface: "#fffaf2",
      text: "#3b2f25",
      button: "#7a4a2a",
      buttonText: "#fffaf2",
      headingFont: "baskerville",
      bodyFont: "nunito",
      buttonStyle: "rounded",
      decoration: "rustic",
    },
  },
  {
    id: "modern",
    name: "Moderno sofisticado",
    description: "Verde profundo, champanhe e linhas geométricas.",
    tokens: {
      primary: "#1e3d36",
      secondary: "#c8a96a",
      background: "#f4f2ed",
      surface: "#ffffff",
      text: "#1b2421",
      button: "#1e3d36",
      buttonText: "#f4f2ed",
      headingFont: "cinzel",
      bodyFont: "raleway",
      buttonStyle: "square",
      decoration: "geometric",
    },
  },
  {
    id: "boho",
    name: "Boho chic",
    description: "Areia, caramelo e ramos de pampas.",
    tokens: {
      primary: "#b07a4f",
      secondary: "#d9b99b",
      background: "#f8f1e9",
      surface: "#fffaf5",
      text: "#4a3426",
      button: "#b07a4f",
      buttonText: "#ffffff",
      headingFont: "greatvibes",
      bodyFont: "josefin",
      buttonStyle: "pill",
      decoration: "boho",
    },
  },
];

export const DEFAULT_THEME = THEME_PRESETS[0];

export function getPreset(id: string): ThemePreset | undefined {
  return THEME_PRESETS.find((p) => p.id === id);
}
