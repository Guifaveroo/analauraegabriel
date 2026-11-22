import type { Metadata } from "next";
import { getPublicSiteData } from "@/lib/data/site";
import { formatDate } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getPublicSiteData();
  const names = `${settings.partner1_name} & ${settings.partner2_name}`;
  const date = formatDate(settings.wedding_at, settings.timezone);
  const title = settings.site_title || `${names} · ${date}`;
  const description = settings.site_description || `Celebre conosco o casamento de ${names} em ${date}. Confirme sua presença!`;
  return {
    title,
    description,
    robots: settings.allow_indexing ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { title, description, type: "website", locale: "pt_BR", siteName: names },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
