import { requireAdmin } from "@/lib/auth";
import { giftStats, loadOrders } from "@/lib/admin/queries";
import { PageHeader, StatCard, EmptyState, Badge, FilterTabs, Notice } from "@/components/admin/ui";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { OrderActions } from "./OrderActions";

const STATUS_LABEL = { PENDING: "Aguardando conferência", PAID: "Pago", CANCELLED: "Cancelado" } as const;

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { supabase } = await requireAdmin();
  const { status: raw = "" } = await searchParams;
  const status = ["PENDING", "PAID", "CANCELLED"].includes(raw) ? raw : "";
  const [orders, stats, all] = await Promise.all([loadOrders(supabase, status || undefined), giftStats(supabase), loadOrders(supabase)]);
  const count = (s: string) => all.filter((o) => o.status === s).length;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Pagamentos"
        description="Confira cada PIX no aplicativo do banco e confirme aqui. O clique do convidado não é considerado pagamento."
        actions={<a href={`/admin/export/pagamentos${status ? `?status=${status}` : ""}`} className="admin-btn admin-btn-secondary">Exportar CSV</a>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Presentes disponíveis" value={stats.available} />
        <StatCard label="Pendentes" value={stats.pendingCount} tone="warning" />
        <StatCard label="Pagos" value={stats.paidCount} tone="success" />
        <StatCard label="Valor pendente" value={formatCurrency(stats.pendingTotal)} tone="warning" hint="ainda não recebido" />
        <StatCard label="Valor confirmado" value={formatCurrency(stats.paidTotal)} tone="success" />
      </div>

      {stats.pendingCount > 0 && (
        <div className="mb-6">
          <Notice tone="info">
            Dica: no extrato do banco procure pelo valor e pelo nome do convidado. O identificador (TXID) também pode aparecer nos detalhes da transação.
          </Notice>
        </div>
      )}

      <FilterTabs
        base="/admin/pagamentos"
        param="status"
        current={status}
        options={[
          { value: "", label: "Todos", count: all.length },
          { value: "PENDING", label: "Pendentes", count: count("PENDING") },
          { value: "PAID", label: "Pagos", count: count("PAID") },
          { value: "CANCELLED", label: "Cancelados", count: count("CANCELLED") },
        ]}
      />

      {orders.length === 0 ? (
        <EmptyState>Nenhuma solicitação {status ? "com este status" : "ainda"}.</EmptyState>
      ) : (
        <div className="admin-card overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="p-3">Convidado</th>
                <th className="p-3">Presente</th>
                <th className="p-3 text-right">Valor</th>
                <th className="p-3">Solicitado em</th>
                <th className="p-3">Status</th>
                <th className="p-3">Confirmado em</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {orders.map((o) => (
                <tr key={o.id} className="align-top">
                  <td className="p-3">
                    <p className="font-medium">{o.guest_name}</p>
                    {o.guest_email && <p className="text-xs text-stone-500">{o.guest_email}</p>}
                    <p className="font-mono text-[0.7rem] text-stone-400">{o.txid}</p>
                  </td>
                  <td className="p-3">{o.gifts?.name ?? "—"}</td>
                  <td className="p-3 text-right font-semibold tabular-nums">{formatCurrency(o.amount)}</td>
                  <td className="whitespace-nowrap p-3 text-stone-600">{formatDateTime(o.created_at)}</td>
                  <td className="p-3"><Badge tone={o.status}>{STATUS_LABEL[o.status]}</Badge></td>
                  <td className="whitespace-nowrap p-3 text-stone-600">{formatDateTime(o.paid_at)}</td>
                  <td className="p-3">
                    <OrderActions id={o.id} status={o.status} guest={o.guest_name} amount={formatCurrency(o.amount)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
