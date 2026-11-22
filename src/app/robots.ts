import type { MetadataRoute } from "next";
import { getPublicSiteData } from "@/lib/data/site";

export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { settings } = await getPublicSiteData();
  return settings.allow_indexing
    ? { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/padrinhos"] }] }
    : { rules: [{ userAgent: "*", disallow: "/" }] };
}
