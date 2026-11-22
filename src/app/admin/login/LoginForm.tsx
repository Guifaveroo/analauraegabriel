"use client";

import { useActionState } from "react";
import { signIn } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, null);
  return (
    <form action={action} className="mt-8 space-y-4">
      <div>
        <label htmlFor="email" className="admin-label">E-mail</label>
        <input id="email" name="email" type="email" required autoComplete="email" defaultValue={state?.email} key={state?.email} className="admin-input" />
      </div>
      <div>
        <label htmlFor="password" className="admin-label">Senha</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="admin-input" />
      </div>
      {state?.error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{state.error}</p>}
      <button type="submit" className="admin-btn w-full" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
