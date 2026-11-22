import { requireAdmin } from "@/lib/auth";
import { loadEditorData } from "@/lib/admin/editorData";
import { Editor } from "@/components/admin/editor/Editor";

export default async function EditorPage({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const { supabase } = await requireAdmin();
  const { aba } = await searchParams;
  const { site, photos, basePreset, hasDraft } = await loadEditorData(supabase);
  const tab = aba === "aparencia" || aba === "secoes" ? aba : "conteudo";

  return (
    <Editor
      initialSections={site.sections}
      initialTheme={site.theme}
      initialPreset={basePreset}
      photos={photos}
      hasDraft={hasDraft}
      initialTab={tab}
    />
  );
}
