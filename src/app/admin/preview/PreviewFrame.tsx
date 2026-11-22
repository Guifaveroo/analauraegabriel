"use client";

import { useEffect, useState } from "react";
import type { SiteData } from "@/lib/types";
import { SiteRenderer } from "@/components/site/SiteRenderer";

export type PreviewMessage = {
  type: "draft";
  sections: SiteData["sections"];
  theme: SiteData["theme"];
  photos: SiteData["photos"];
  gallery: SiteData["gallery"];
  scrollTo?: string;
};

export function PreviewFrame({ initial }: { initial: SiteData }) {
  const [data, setData] = useState(initial);

  useEffect(() => {
    const onMessage = (e: MessageEvent<PreviewMessage>) => {
      // aceita mensagens apenas do próprio painel (mesma origem)
      if (e.origin !== window.location.origin || e.data?.type !== "draft") return;
      const { sections, theme, photos, gallery, scrollTo } = e.data;
      setData((d) => ({ ...d, sections, theme, photos, gallery }));
      if (scrollTo) {
        requestAnimationFrame(() => document.getElementById(scrollTo)?.scrollIntoView({ behavior: "smooth", block: "start" }));
      }
    };
    window.addEventListener("message", onMessage);
    window.parent?.postMessage({ type: "preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return <SiteRenderer data={data} preview />;
}
