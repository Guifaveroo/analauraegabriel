export const ALBUMS = ["library", "cover", "gallery", "story", "godparents", "dresscode", "gifts"] as const;
export type Album = (typeof ALBUMS)[number];

export const ALBUM_LABELS: Record<Album, string> = {
  library: "Biblioteca",
  cover: "Capa",
  gallery: "Galeria",
  story: "Nossa história",
  godparents: "Padrinhos",
  dresscode: "Dress code",
  gifts: "Presentes",
};
