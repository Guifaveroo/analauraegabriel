import { ImageResponse } from "next/og";
import { getPublicSiteData } from "@/lib/data/site";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";
export const revalidate = 3600;

/** Favicon personalizado com as iniciais do casal nas cores do tema. */
export default async function Icon() {
  const { settings, theme } = await getPublicSiteData();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
          background: theme.primary, color: theme.buttonText, fontSize: 28, fontFamily: "serif", borderRadius: 32,
        }}
      >
        {settings.partner1_name.charAt(0)}&{settings.partner2_name.charAt(0)}
      </div>
    ),
    size,
  );
}
