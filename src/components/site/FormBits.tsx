"use client";

import { useEffect, useRef } from "react";

/** Campos antispam invisíveis: isca + horário de abertura do formulário. */
export function SpamFields() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.value = String(Date.now());
  }, []);
  return (
    <>
      <div className="honeypot" aria-hidden>
        <label>
          Site
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input ref={ref} type="hidden" name="_t" defaultValue="" />
    </>
  );
}

export function Consent({ children }: { children: React.ReactNode }) {
  return (
    <label className="flex items-start gap-3 text-xs leading-5 opacity-80">
      <input type="checkbox" name="consent" required className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--c-primary)]" />
      <span>
        {children}{" "}
        <a href="/privacidade" target="_blank" className="underline underline-offset-2">
          Política de privacidade
        </a>
        .
      </span>
    </label>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
      {message}
    </p>
  );
}

export function PreviewNotice() {
  return <p className="rounded-md bg-amber-50 px-4 py-3 text-center text-xs text-amber-900">Pré-visualização: envio desativado.</p>;
}
