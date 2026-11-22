"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type ReactNode } from "react";

export type AdminResult = { ok: boolean; error?: string; message?: string };

type Props = {
  action: (form: FormData) => Promise<AdminResult>;
  children: ReactNode;
  className?: string;
  submitLabel?: string;
  resetOnSuccess?: boolean;
  onSuccess?: () => void;
  confirm?: string;
  hideSubmit?: boolean;
};

/** Formulário do painel: chama a Server Action, mostra o resultado e atualiza a página. */
export function ActionForm({ action, children, className = "", submitLabel = "Salvar", resetOnSuccess, onSuccess, confirm, hideSubmit }: Props) {
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<AdminResult | null>(null);

  return (
    <form
      ref={ref}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        if (confirm && !window.confirm(confirm)) return;
        const form = new FormData(e.currentTarget);
        setStatus(null);
        start(async () => {
          let res: AdminResult;
          try {
            res = await action(form);
          } catch (e) {
            res = { ok: false, error: e instanceof Error ? e.message : "Erro inesperado" };
          }
          setStatus(res);
          if (res.ok) {
            if (resetOnSuccess) ref.current?.reset();
            onSuccess?.();
            router.refresh();
          }
        });
      }}
    >
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      {!hideSubmit && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="submit" className="admin-btn" disabled={pending}>
            {pending ? "Salvando…" : submitLabel}
          </button>
          <StatusText status={status} />
        </div>
      )}
      {hideSubmit && <StatusText status={status} />}
    </form>
  );
}

export function StatusText({ status }: { status: AdminResult | null }) {
  if (!status) return null;
  return (
    <span role="status" className={`text-sm ${status.ok ? "text-emerald-700" : "text-red-700"}`}>
      {status.ok ? status.message ?? "Salvo ✓" : status.error}
    </span>
  );
}

/** Botão que executa uma ação simples (sem formulário visível). */
export function ActionButton({
  action,
  children,
  className = "admin-btn-secondary admin-btn",
  confirm,
  title,
}: {
  action: () => Promise<AdminResult>;
  children: ReactNode;
  className?: string;
  confirm?: string;
  title?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      title={title}
      className={className}
      disabled={pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          const res = await action().catch((e: unknown) => ({ ok: false, error: e instanceof Error ? e.message : "Erro" }));
          if (!res.ok) window.alert(res.error ?? "Não foi possível concluir.");
          router.refresh();
        });
      }}
    >
      {pending ? "…" : children}
    </button>
  );
}
