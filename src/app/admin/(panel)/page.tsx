import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { giftStats, loadGuestsData, rsvpStats } from "@/lib/admin/queries";
import { PageHeader, StatCard, Badge } from "@/components/admin/ui";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { AdminCountdown } from "@/components/admin/AdminCountdown";

export default async function DashboardPage() {
  const { supabase } = await requireAdmin();
  const [{ data: s }, guestsData, gifts, { data: messages }, { data: drafts }] = await Promise.all([
    supabase.from("wedding_settings").select("partner1_name,partner2_name,wedding_at,timezone,pix_key").eq("id", 1).single(),
    loadGuestsData(supabase),
    giftStats(supabase),
    supabase.from("messages").select("id,name,message,status,created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("wedding_sections").select("key").not("draft", "is", null),
  ]);
  const rsvp = rsvpStats(guestsData.guests, guestsData.responses);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={s ? `${s.partner1_name} & ${s.partner2_name}` : "Dashboard"}
        description={s ? `Casamento em ${formatDate(s.wedding_at, s.timezone)}` : undefined}
        actions={
          <Link href="/admin/editor" className="admin-btn">
            Editar meu site
          </Link>
        }
      />

      {s && (
        <div className="admin-card mb-6 flex flex-col items-center gap-2 p-6 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Contagem regressiva</p>
          <AdminCountdown target={s.wedding_at} />
        </div>
      )}

      {(!s?.pix_key || (drafts?.length ?? 0) > 0) && (
        <div className="mb-6 space-y-2">
          {!s?.pix_key && (
            <Link href="/admin/configuracoes#pix" className="block rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Cadastre a chave PIX em Configurações para liberar a lista de presentes →
            </Link>
          )}
          {(drafts?.length ?? 0) > 0 && (
            <Link href="/admin/editor" className="block rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
              Existem alterações salvas como rascunho e ainda não publicadas →
            </Link>
          )}
        </div>
      )}

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">Convidados</h2>
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Total de convidados" value={rsvp.totalGuests} />
        <StatCard label="Confirmados" value={rsvp.confirmed} tone="success" />
        <StatCard label="Ausentes" value={rsvp.absent} />
        <StatCard label="Sem resposta" value={rsvp.noResponse} tone="warning" />
        <StatCard label="Pessoas confirmadas" value={rsvp.people} hint="inclui acompanhantes" />
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">Presentes</h2>
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Presentes recebidos" value={gifts.paidCount} tone="success" hint={formatCurrency(gifts.paidTotal)} />
        <StatCard label="Pagamentos pendentes" value={gifts.pendingCount} tone="warning" hint={`${formatCurrency(gifts.pendingTotal)} a conferir`} />
        <StatCard label="Valor confirmado" value={formatCurrency(gifts.paidTotal)} tone="success" />
        <StatCard label="Disponíveis na lista" value={gifts.available} />
      </div>

      <div className="admin-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Mensagens recentes</h2>
          <Link href="/admin/mensagens" className="text-sm text-stone-500 hover:text-stone-900">Ver todas →</Link>
        </div>
        {(messages ?? []).length === 0 ? (
          <p className="text-sm text-stone-500">Nenhuma mensagem ainda.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {messages!.map((m) => (
              <li key={m.id} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{m.name}</p>
                  <p className="line-clamp-2 text-sm text-stone-600">{m.message}</p>
                  <p className="mt-1 text-xs text-stone-400">{formatDateTime(m.created_at)}</p>
                </div>
                <Badge tone={m.status}>{m.status === "pending" ? "Aguardando" : m.status === "approved" ? "Publicada" : "Rejeitada"}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
