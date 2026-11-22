import { SiteRenderer } from "@/components/site/SiteRenderer";
import { getPublicSiteData } from "@/lib/data/site";

// Página estática regenerada a cada 5 minutos ou imediatamente após edições no painel.
export const revalidate = 300;

export default async function HomePage() {
  const data = await getPublicSiteData();
  return <SiteRenderer data={data} />;
}
