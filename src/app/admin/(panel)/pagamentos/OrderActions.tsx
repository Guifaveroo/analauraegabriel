"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getOrderHistory, setOrderStatus } from "@/app/admin/actions/payments";
import { formatDateTime } from "@/lib/format";
import type { GiftOrderStatus } from "@/lib/types";

const LABEL: Record<GiftOrderStatus, string> = { PENDING: "Pendente", PAID: "Pago", CANCELLED: "Cancelado" };

type Event = Awaited<ReturnType<typeof getOrderHistory>>[number];

export function OrderActions({ id, status, guest, amount }: { id: string; status: GiftOrderStatus; guest: string; amount: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [history, setHistory] = useState<Event[] | null>(null);

  const change = (to: GiftOrderStatus, question: string, askNote = false) => {
    if (!window.confirm(question)) return;
    const note = askNote ? window.prompt("Observação (opcional):") ?? "" : "";
    start(async () => {
      const res = await setOrderStatus(id, to, note);
      if (!res.ok) window.alert(res.error);
      setHistory(null);
      router.refresh();
    });
  };

  const btn = "admin-btn !min-h-8 !px-2.5 text-xs";

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-1">
        {status === "PENDING" && (
          <>
            <button type="button" disabled={pending} className={`${btn} admin-btn-success`} onClick={() => change("PAID", `Confirmar que o PIX de ${amount} de ${guest} foi recebido na conta?`)}>
              Confirmar pagamento
            </button>
            <button type="button" disabled={pending} className={`${btn} admin-btn-danger`} onClick={() => change("CANCELLED", "Cancelar esta solicitação? O presente volta a ficar disponível.", true)}>
              Cancelar
            </button>
          </>
        )}
        {status === "PAID" && (
          <>
            <button type="button" disabled={pending} className={`${btn} admin-btn-secondary`} onClick={() => change("PENDING", "Desfazer a confirmação e voltar para pendente?", true)}>
              Desfazer
            </button>
            <button type="button" disabled={pending} className={`${btn} admin-btn-danger`} onClick={() => change("CANCELLED", "Liberar o presente novamente? A solicitação será cancelada (use em caso de estorno ou engano).", true)}>
              Liberar presente
            </button>
          </>
        )}
        {status === "CANCELLED" && (
          <button type="button" disabled={pending} className={`${btn} admin-btn-secondary`} onClick={() => change("PENDING", "Reativar esta solicitação como pendente?")}>
            Reativar
          </button>
        )}
        <button
          type="button"
          className={`${btn} admin-btn-secondary`}
          onClick={() => (history ? setHistory(null) : start(async () => setHistory(await getOrderHistory(id))))}
        >
          {history ? "Ocultar" : "Histórico"}
        </button>
      </div>
      {history && (
        <ol className="mt-1 w-64 space-y-1 rounded-lg bg-stone-50 p-2 text-left text-xs">
          {history.map((e) => (
            <li key={e.id}>
              <span className="text-stone-500">{formatDateTime(e.created_at)}</span> — {e.from_status ? `${LABEL[e.from_status as GiftOrderStatus]} → ` : ""}
              <strong>{LABEL[e.to_status as GiftOrderStatus]}</strong>
              {e.note && <span className="block text-stone-500">{e.note}</span>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
