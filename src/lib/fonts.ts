import {
  Cinzel,
  Cormorant_Garamond,
  Great_Vibes,
  Inter,
  Josefin_Sans,
  Lato,
  Libre_Baskerville,
  Marcellus,
  Montserrat,
  Nunito_Sans,
  Playfair_Display,
  Raleway,
} from "next/font/google";

// Fontes auto-hospedadas pelo Next (sem requisições ao Google no navegador).
// Apenas as fontes efetivamente usadas pelo tema são baixadas pelo navegador.
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-cormorant", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-playfair", display: "swap", preload: false });
const baskerville = Libre_Baskerville({ subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"], variable: "--font-baskerville", display: "swap", preload: false });
const marcellus = Marcellus({ subsets: ["latin"], weight: "400", variable: "--font-marcellus", display: "swap", preload: false });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", display: "swap", preload: false });
const greatvibes = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--font-greatvibes", display: "swap", preload: false });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap", preload: false });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", display: "swap" });
const lato = Lato({ subsets: ["latin"], weight: ["300", "400", "700"], variable: "--font-lato", display: "swap", preload: false });
const josefin = Josefin_Sans({ subsets: ["latin"], variable: "--font-josefin", display: "swap", preload: false });
const raleway = Raleway({ subsets: ["latin"], variable: "--font-raleway", display: "swap", preload: false });
const nunito = Nunito_Sans({ subsets: ["latin"], variable: "--font-nunito", display: "swap", preload: false });

export const fontVariables = [
  cormorant, playfair, baskerville, marcellus, cinzel, greatvibes,
  inter, montserrat, lato, josefin, raleway, nunito,
].map((f) => f.variable).join(" ");
