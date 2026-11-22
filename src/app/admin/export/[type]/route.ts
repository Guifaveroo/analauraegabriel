import { NextResponse, type NextRequest } from "next/server";
import { createSessionClient } from "@/lib/supabase/server";
import { loadGuestsData, loadOrders } from "@/lib/admin/queries";
import { toCsv } from "@/lib/csv";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const ORDER_STATUS = { PENDING: "Pendente", PAID: "Pago", CANCELLED: "Cancelado" } as const;

export async function GET(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Não autorizado", { status: 401 });
  const { data: admin } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) return new NextResponse("Não autorizado", { status: 403 });

  const { type } = await params;
  const sp = request.nextUrl.searchParams;
  let csv: string;

  if (type === "convidados" || type === "confirmacoes") {
    const { guests, groups, responses } = await loadGuestsData(supabase);
    const groupName = new Map(groups.map((g) => [g.id, g.name]));
    const familyCode = new Map(groups.map((g) => [g.id, g.invite_code]));
    const byGuest = new Map(responses.filter((r) => r.guest_id).map((r) => [r.guest_id!, r]));

    if (type === "convidados") {
      const resp = sp.get("resposta");
      const rows = guests
        .filter((g) => (!sp.get("familia") || g.family_id === sp.get("familia")) && (!sp.get("grupo") || g.category_id === sp.get("grupo")))
        .filter((g) => {
          const r = byGuest.get(g.id);
          return resp === "sim" ? r?.attending : resp === "nao" ? r && !r.attending : resp === "sem" ? !r : true;
        })
        .map((g) => {
          const r = byGuest.get(g.id);
          return [
            g.name, g.family_id ? groupName.get(g.family_id) : "", g.family_id ? familyCode.get(g.family_id) : "",
            g.category_id ? groupName.get(g.category_id) : "", g.phone, g.email, g.max_companions,
            r ? (r.attending ? "Sim" : "Não") : "Sem resposta", r?.companions.join(", ") ?? "", g.notes,
          ];
        });
      csv = toCsv(["Nome", "Família", "Código do convite", "Grupo", "Telefone", "E-mail", "Acompanhantes permitidos", "Presença", "Acompanhantes", "Observações"], rows);
    } else {
      const status = sp.get("status");
      const rows = responses
        .filter((r) => (status === "sim" ? r.attending : status === "nao" ? !r.attending : true))
        .map((r) => {
          const g = r.guest_id ? guests.find((x) => x.id === r.guest_id) : undefined;
          return [
            r.name, g?.family_id ? groupName.get(g.family_id) : r.guest_id ? "" : "RSVP aberto", r.attending ? "Sim" : "Não",
            r.companions.length, r.companions.join(", "), r.attending ? 1 + r.companions.length : 0, r.dietary, r.notes, formatDateTime(r.responded_at),
          ];
        });
      csv = toCsv(["Nome", "Família", "Presença", "Nº acompanhantes", "Acompanhantes", "Total de pessoas", "Restrições alimentares", "Observações", "Respondido em"], rows);
    }
  } else if (type === "pagamentos") {
    const status = sp.get("status");
    const orders = await loadOrders(supabase, status && ["PENDING", "PAID", "CANCELLED"].includes(status) ? status : undefined);
    csv = toCsv(
      ["Convidado", "E-mail", "Presente", "Valor (R$)", "Status", "Solicitado em", "Confirmado em", "TXID"],
      orders.map((o) => [
        o.guest_name, o.guest_email ?? "", o.gifts?.name ?? "", o.amount.toFixed(2).replace(".", ","), ORDER_STATUS[o.status],
        formatDateTime(o.created_at), o.paid_at ? formatDateTime(o.paid_at) : "", o.txid,
      ]),
    );
  } else {
    return new NextResponse("Não encontrado", { status: 404 });
  }

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
