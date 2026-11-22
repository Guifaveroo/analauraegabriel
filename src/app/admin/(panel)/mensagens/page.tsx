import { requireAdmin } from "@/lib/auth";
import { PageHeader, EmptyState, Badge, FilterTabs } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/ActionForm";
import { deleteMessage, setMessageStatus } from "@/app/admin/actions/messages";
import { formatDateTime } from "@/lib/format";

type Msg = { id: string; name: string; message: string; status: "pending" | "approved" | "rejected"; created_at: string };
const LABEL = { pending: "Aguardando", approved: "Publicada", rejected: "Rejeitada" } as const;

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { supabase } = await requireAdmin();
  const { status: raw } = await searchParams;
  const status = raw === "approved" || raw === "rejected" || raw === "all" ? raw : "pending";
  const { data } = await supabase.from("messages").select("*").order("created_at", { ascending: false });
  const all = (data ?? []) as Msg[];
  const list = status === "all" ? all : all.filter((m) => m.status === status);
  const btn = "admin-btn !min-h-8 !px-2.5 text-xs";

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Mensagens" description="Recados deixados pelos convidados. Apenas mensagens aprovadas aparecem no site." />
      <FilterTabs
        base="/admin/mensagens"
        param="status"
        current={status === "pending" ? "" : status}
        options={[
          { value: "", label: "Aguardando aprovação", count: all.filter((m) => m.status === "pending").length },
          { value: "approved", label: "Publicadas", count: all.filter((m) => m.status === "approved").length },
          { value: "rejected", label: "Rejeitadas", count: all.filter((m) => m.status === "rejected").length },
          { value: "all", label: "Todas", count: all.length },
        ]}
      />
      {list.length === 0 ? (
        <EmptyState>Nenhuma mensagem aqui.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {list.map((m) => (
            <li key={m.id} className="admin-card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-xs text-stone-500">{formatDateTime(m.created_at)}</p>
                </div>
                <Badge tone={m.status}>{LABEL[m.status]}</Badge>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-stone-700">{m.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {m.status !== "approved" && (
                  <ActionButton action={setMessageStatus.bind(null, m.id, "approved")} className={`${btn} admin-btn-success`}>Aprovar e publicar</ActionButton>
                )}
                {m.status === "approved" && (
                  <ActionButton action={setMessageStatus.bind(null, m.id, "pending")} className={`${btn} admin-btn-secondary`}>Despublicar</ActionButton>
                )}
                {m.status !== "rejected" && (
                  <ActionButton action={setMessageStatus.bind(null, m.id, "rejected")} className={`${btn} admin-btn-secondary`}>Rejeitar</ActionButton>
                )}
                <ActionButton action={deleteMessage.bind(null, m.id)} confirm="Excluir esta mensagem definitivamente?" className={`${btn} admin-btn-danger`}>Excluir</ActionButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
