import { requireAdmin } from "@/lib/auth";
import { PageHeader, EmptyState, Badge } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/ActionForm";
import { deleteGift, moveGift } from "@/app/admin/actions/gifts";
import { formatCurrency } from "@/lib/format";
import { storageUrl } from "@/lib/photos";
import type { Gift, Photo } from "@/lib/types";
import { GiftEditor } from "./GiftEditor";

const MODE_LABEL = { single: "Única", limited: "Limitada", unlimited: "Várias contribuições" } as const;

export default async function GiftsPage() {
  const { supabase } = await requireAdmin();
  const [{ data: gifts }, { data: photos }, { data: stock }] = await Promise.all([
    supabase.from("gifts").select("*").order("position").order("created_at"),
    supabase.from("photos").select("*").order("album").order("position"),
    supabase.rpc("public_gift_stock"),
  ]);
  const list = (gifts ?? []) as Gift[];
  const photoList = (photos ?? []) as Photo[];
  const photoMap = new Map(photoList.map((p) => [p.id, p]));
  const stockMap = new Map(((stock ?? []) as { gift_id: string; pending: number; paid: number; remaining: number | null; status: string }[]).map((s) => [s.gift_id, s]));
  const categories = Array.from(new Set(list.map((g) => g.category).filter(Boolean)));

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Lista de presentes" description="Presentes simbólicos pagos via PIX diretamente para vocês. Defina valor, categoria e disponibilidade." />

      <details className="admin-card mb-6 p-5">
        <summary className="cursor-pointer font-semibold">+ Novo presente</summary>
        <div className="mt-4">
          <GiftEditor photos={photoList} categories={categories} />
        </div>
      </details>

      {list.length === 0 ? (
        <EmptyState>Nenhum presente cadastrado.</EmptyState>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {list.map((g, i) => {
            const photo = g.photo_id ? photoMap.get(g.photo_id) : undefined;
            const s = stockMap.get(g.id);
            return (
              <li key={g.id} className={`admin-card flex gap-4 p-4 ${g.active ? "" : "opacity-60"}`}>
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                  {photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={storageUrl(photo.thumb_path)} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{g.name}</p>
                      <p className="text-xs text-stone-500">{[g.category, MODE_LABEL[g.mode]].filter(Boolean).join(" · ")}</p>
                    </div>
                    <p className="shrink-0 font-semibold">{formatCurrency(Number(g.price))}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                    {!g.active && <Badge tone="CANCELLED">Inativo</Badge>}
                    {g.active && s && <Badge tone={s.status}>{s.status === "AVAILABLE" ? (s.remaining !== null ? `${s.remaining} disponível(is)` : "Disponível") : s.status === "PENDING" ? "Reservado" : "Presenteado"}</Badge>}
                    {s && s.pending > 0 && <Badge tone="PENDING">{s.pending} pendente(s)</Badge>}
                    {s && s.paid > 0 && <Badge tone="PAID">{s.paid} pago(s)</Badge>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <GiftEditor gift={g} photos={photoList} categories={categories} asDialog />
                    <ActionButton action={moveGift.bind(null, g.id, -1)} className="admin-btn admin-btn-secondary !min-h-8 !px-2 text-xs" title="Subir">{i === 0 ? "·" : "↑"}</ActionButton>
                    <ActionButton action={moveGift.bind(null, g.id, 1)} className="admin-btn admin-btn-secondary !min-h-8 !px-2 text-xs" title="Descer">{i === list.length - 1 ? "·" : "↓"}</ActionButton>
                    <ActionButton action={deleteGift.bind(null, g.id)} confirm={`Excluir "${g.name}"? Se houver solicitações, ele será apenas desativado.`} className="admin-btn admin-btn-danger !min-h-8 !px-2 text-xs">
                      Excluir
                    </ActionButton>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
