"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { unlockGodparents } from "../actions";
import { FormError } from "@/components/site/FormBits";

export function GodparentsGate() {
  const router = useRouter();
  const [state, action, pending] = useActionState(unlockGodparents, null);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={action} className="space-y-4 text-left">
      <label htmlFor="gp-pass" className="label">Senha</label>
      <input id="gp-pass" name="password" type="password" required autoComplete="current-password" className="field" />
      <FormError message={state && !state.ok ? state.error : null} />
      <button type="submit" className="btn w-full" disabled={pending}>
        {pending ? "Verificando…" : "Entrar"}
      </button>
    </form>
  );
}
