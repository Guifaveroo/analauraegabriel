import { requireAdmin } from "@/lib/auth";
import { loadGuestsData, rsvpStats } from "@/lib/admin/queries";
import { PageHeader, StatCard, EmptyState, Badge, FilterTabs } from "@/components/admin/ui";
import { ActionButton, ActionForm } from "@/components/admin/ActionForm";
import { deleteRsvpResponse, purgeGuestData } from "@/app/admin/actions/guests";
import { formatDateTime } from "@/lib/format";

export default async function RsvpPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { supabase } = await requireAdmin();
  const { status = "" } = await searchParams;
  const { guests, groups, responses } = await loadGuestsData(supabase);
  const stats = rsvpStats(guests, responses);
  const guestById = new Map(guests.map((g) => [g.id, g]));
  const groupName = new Map(groups.map((g) => [g.id, g.name]));
  const answered = new Set(responses.map((r) => r.guest_id).filter(Boolean));
  const noResponse = guests.filter((g) => !answered.has(g.id));

  const list = responses.filter((r) => (status === "sim" ? r.attending : status === "nao" ? !r.attending : true));
  const dietary = responses.filter((r) => r.attending && r.dietary);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Confirmações"
        description="Respostas de presença registradas pelos convidados, com data e horário."
        actions={<a href={`/admin/export/confirmacoes${status ? `?status=${status}` : ""}`} className="admin-btn admin-btn-secondary">Exportar CSV</a>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Total de convidados" value={stats.totalGuests} />
        <StatCard label="Confirmados" value={stats.confirmed} tone="success" />
        <StatCard label="Ausentes" value={stats.absent} />
        <StatCard label="Sem resposta" value={stats.noResponse} tone="warning" />
        <StatCard label="Total de pessoas" value={stats.people} hint="confirmados + acompanhantes" />
      </div>

      <FilterTabs
        base="/admin/confirmacoes"
        param="status"
        current={status}
        options={[
          { value: "", label: "Todas as respostas", count: responses.length },
          { value: "sim", label: "Confirmados", count: stats.confirmed },
          { value: "nao", label: "Ausentes", count: stats.absent },
          { value: "sem", label: "Sem resposta", count: noResponse.length },
        ]}
      />

      {status === "sem" ? (
        noResponse.length === 0 ? (
          <EmptyState>Todos os convidados cadastrados já responderam. ♡</EmptyState>
        ) : (
          <div className="admin-card divide-y divide-stone-100">
            {noResponse.map((g) => (
              <div key={g.id} className="flex items-center justify-between p-3 text-sm">
                <span className="font-medium">{g.name}</span>
                <span className="text-stone-500">{[g.family_id && groupName.get(g.family_id), g.phone].filter(Boolean).join(" · ")}</span>
              </div>
            ))}
          </div>
        )
      ) : list.length === 0 ? (
        <EmptyState>Nenhuma resposta ainda.</EmptyState>
      ) : (
        <div className="admin-card overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="p-3">Convidado</th>
                <th className="p-3">Resposta</th>
                <th className="p-3">Acompanhantes</th>
                <th className="p-3">Restrições / observações</th>
                <th className="p-3">Respondido em</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {list.map((r) => {
                const g = r.guest_id ? guestById.get(r.guest_id) : undefined;
                return (
                  <tr key={r.id} className="align-top">
                    <td className="p-3">
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-stone-500">{g?.family_id ? groupName.get(g.family_id) : r.guest_id ? "" : "RSVP aberto"}</p>
                    </td>
                    <td className="p-3"><Badge tone={r.attending ? "yes" : "no"}>{r.attending ? "Confirmado" : "Ausente"}</Badge></td>
                    <td className="p-3 text-stone-600">{r.companions.length ? r.companions.join(", ") : "—"}</td>
                    <td className="max-w-xs p-3 text-stone-600">
                      {r.dietary && <p><strong>Restrição:</strong> {r.dietary}</p>}
                      {r.notes && <p className="whitespace-pre-line">{r.notes}</p>}
                      {!r.dietary && !r.notes && "—"}
                    </td>
                    <td className="whitespace-nowrap p-3 text-stone-600">{formatDateTime(r.responded_at)}</td>
                    <td className="p-3 text-right">
                      <ActionButton action={deleteRsvpResponse.bind(null, r.id)} confirm="Apagar esta resposta? O convidado poderá responder novamente." className="admin-btn admin-btn-danger !min-h-8 !px-2 text-xs">
                        Apagar
                      </ActionButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {dietary.length > 0 && status !== "sem" && (
        <div className="admin-card mt-6 p-5">
          <h2 className="mb-3 font-semibold">Restrições alimentares ({dietary.length})</h2>
          <ul className="space-y-1 text-sm">
            {dietary.map((r) => <li key={r.id}><strong>{r.name}:</strong> {r.dietary}</li>)}
          </ul>
        </div>
      )}

      <details className="admin-card mt-10 p-5">
        <summary className="cursor-pointer text-sm font-semibold text-red-800">Privacidade (LGPD): apagar dados dos convidados</summary>
        <p className="mt-3 text-sm text-stone-600">
          Após o casamento, apague convidados, famílias, respostas e mensagens. Pedidos de presentes são mantidos para o seu controle financeiro.
        </p>
        <ActionForm action={purgeGuestData} submitLabel="Apagar definitivamente" confirm="Esta ação não pode ser desfeita. Continuar?" className="mt-3">
          <input name="confirm" placeholder="Digite APAGAR" className="admin-input max-w-xs" aria-label="Confirmação" />
        </ActionForm>
      </details>
    </div>
  );
}
