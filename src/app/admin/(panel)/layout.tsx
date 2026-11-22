import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { Sidebar } from "@/components/admin/Sidebar";

export const metadata: Metadata = { title: "Painel dos noivos", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { supabase } = await requireAdmin();
  const [{ data: s }, { count }] = await Promise.all([
    supabase.from("wedding_settings").select("partner1_name,partner2_name").eq("id", 1).maybeSingle(),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  const couple = s ? `${s.partner1_name} & ${s.partner2_name}` : "Nosso casamento";

  return (
    <div className="admin lg:flex">
      <Sidebar couple={couple} pendingMessages={count ?? 0} />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
