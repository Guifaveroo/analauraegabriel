import { redirect } from "next/navigation";

/** Personalização = aba "Aparência" do editor visual (com pré-visualização). */
export default function PersonalizationPage() {
  redirect("/admin/editor?aba=aparencia");
}
