import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { loadEditorData } from "@/lib/admin/editorData";
import { PreviewFrame } from "./PreviewFrame";

export const metadata: Metadata = { title: "Pré-visualização", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Página carregada dentro do iframe do editor: mostra o rascunho e recebe alterações em tempo real. */
export default async function PreviewPage() {
  const { supabase } = await requireAdmin();
  const { site } = await loadEditorData(supabase);
  return <PreviewFrame initial={site} />;
}
