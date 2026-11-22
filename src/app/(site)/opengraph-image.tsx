import { ImageResponse } from "next/og";
import { getPublicSiteData } from "@/lib/data/site";
import { formatDate } from "@/lib/format";
import { storageUrl } from "@/lib/photos";

export const alt = "Convite de casamento";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

/** Prévia exibida ao compartilhar o link no WhatsApp e redes sociais. */
export default async function OgImage() {
  const { settings, theme, photos, sections } = await getPublicSiteData();
  const hero = sections.find((s) => s.key === "hero")?.content as { photoId?: string | null } | undefined;
  const photo = (settings.og_photo_id && photos[settings.og_photo_id]) || (hero?.photoId ? photos[hero.photoId] : undefined);
  const bg = photo ? storageUrl(photo.storage_path) : null;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: theme.primary }}>
        {bg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bg} alt="" width={1200} height={630} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.38)", display: "flex" }} />
        <div
          style={{
            position: "absolute", inset: 36, border: "2px solid rgba(255,255,255,0.75)", display: "flex",
            flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", textAlign: "center",
          }}
        >
          <div style={{ fontSize: 26, letterSpacing: 10, textTransform: "uppercase", opacity: 0.9 }}>Vamos nos casar</div>
          <div style={{ fontSize: 104, marginTop: 24, fontFamily: "serif", display: "flex" }}>
            {settings.partner1_name} & {settings.partner2_name}
          </div>
          <div style={{ fontSize: 34, marginTop: 24, letterSpacing: 6, textTransform: "uppercase" }}>
            {formatDate(settings.wedding_at, settings.timezone)}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
