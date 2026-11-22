import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { getProtectedSection, getPublicSiteData } from "@/lib/data/site";
import { createServiceClient } from "@/lib/supabase/admin";
import { GODPARENTS_COOKIE, verifySignedValue } from "@/lib/security";
import { themeToCssVars } from "@/lib/themes/css";
import { GodparentsManual } from "@/components/site/Godparents";
import { Ornament } from "@/components/site/Ornament";
import { GodparentsGate } from "./GodparentsGate";
import type { SectionContentMap } from "@/lib/content/schemas";
import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Manual dos padrinhos", robots: { index: false } };

export default async function GodparentsPage() {
  const data = await getPublicSiteData();
  const meta = data.sections.find((s) => s.key === "godparents");
  const style = themeToCssVars(data.theme);

  let unlocked = !meta?.is_protected;
  let content = meta?.content as SectionContentMap["godparents"] | undefined;

  if (meta?.is_protected && isSupabaseConfigured) {
    const { data: priv } = await createServiceClient().from("wedding_private").select("godparents_password_hash").eq("id", 1).single();
    const hash = priv?.godparents_password_hash;
    const token = (await cookies()).get(GODPARENTS_COOKIE)?.value;
    unlocked = Boolean(hash) && verifySignedValue(token, String(hash).slice(-16));
    if (unlocked) content = (await getProtectedSection("godparents"))?.content as SectionContentMap["godparents"];
  }

  return (
    <div className="site" style={style}>
      <header className="flex h-16 items-center justify-between px-5 sm:px-8">
        <Link href="/" className="font-heading text-2xl">
          {data.settings.partner1_name.charAt(0)}&{data.settings.partner2_name.charAt(0)}
        </Link>
        <Link href="/" className="text-xs uppercase tracking-[0.2em] opacity-80 hover:opacity-100">
          ← Voltar ao site
        </Link>
      </header>

      {!meta ? (
        <p className="px-6 py-32 text-center">Esta seção não está disponível.</p>
      ) : unlocked && content ? (
        <GodparentsManual content={content} settings={data.settings} photos={data.photos} decoration={data.theme.decoration} />
      ) : (
        <main className="flex min-h-[70dvh] items-center justify-center px-5 py-16">
          <div className="card w-full max-w-md p-8 text-center sm:p-10">
            <p className="eyebrow">Acesso restrito</p>
            <h1 className="heading-md mt-3">Manual dos padrinhos</h1>
            <Ornament decoration={data.theme.decoration} className="mt-5" />
            <p className="muted mb-8 mt-5 text-sm leading-6">Digite a senha que enviamos para vocês.</p>
            <GodparentsGate />
          </div>
        </main>
      )}
    </div>
  );
}
