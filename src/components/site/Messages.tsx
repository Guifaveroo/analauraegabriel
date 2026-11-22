"use client";

import { useRef, useState, useTransition } from "react";
import type { SectionContentMap, ThemeTokens } from "@/lib/content/schemas";
import type { PublicMessage } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { postMessage } from "@/app/(site)/actions";
import { SectionShell } from "./SectionShell";
import { Reveal } from "./Reveal";
import { Consent, FormError, PreviewNotice, SpamFields } from "./FormBits";

type Props = {
  content: SectionContentMap["messages"];
  messages: PublicMessage[];
  decoration: ThemeTokens["decoration"];
  timezone: string;
  preview?: boolean;
};

export function Messages({ content, messages, decoration, timezone, preview }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const submit = (form: FormData) => {
    if (preview) return;
    setError(null);
    startTransition(async () => {
      const res = await postMessage(form);
      if (!res.ok) return setError(res.error);
      setSent(true);
      formRef.current?.reset();
    });
  };

  return (
    <SectionShell id="recados" eyebrow="Mural" title={content.title} subtitle={content.subtitle} decoration={decoration} tone="tint">
      <div className="grid gap-10 lg:grid-cols-5">
        <Reveal className="lg:col-span-2">
          <form ref={formRef} action={submit} className="card space-y-5 p-6 sm:p-8">
            <SpamFields />
            <div>
              <label htmlFor="msg-name" className="label">Seu nome</label>
              <input id="msg-name" name="name" required minLength={2} maxLength={80} autoComplete="name" className="field" />
            </div>
            <div>
              <label htmlFor="msg-text" className="label">Mensagem</label>
              <textarea id="msg-text" name="message" required minLength={3} maxLength={1000} rows={5} className="field" />
            </div>
            <Consent>Concordo que minha mensagem e meu nome sejam publicados no site após aprovação dos noivos.</Consent>
            <FormError message={error} />
            {sent && (
              <p role="status" className="rounded-md bg-primary/10 px-4 py-3 text-sm">
                Mensagem enviada! Ela aparecerá aqui assim que os noivos aprovarem. ♡
              </p>
            )}
            {preview && <PreviewNotice />}
            <button type="submit" className="btn w-full" disabled={pending || preview}>
              {pending ? "Enviando…" : "Enviar mensagem"}
            </button>
          </form>
        </Reveal>

        <div className="lg:col-span-3">
          {messages.length === 0 ? (
            <p className="muted py-10 text-center font-heading text-xl italic">Seja o primeiro a deixar um recado.</p>
          ) : (
            <ul className="columns-1 gap-5 sm:columns-2 [&>li]:mb-5">
              {messages.map((m, i) => (
                <li key={m.id} className="break-inside-avoid">
                  <Reveal delay={(i % 4) * 60}>
                    <figure className="card p-6">
                      <span aria-hidden className="font-heading text-4xl leading-none text-primary/50">“</span>
                      <blockquote className="-mt-2 whitespace-pre-line text-sm leading-7">{m.message}</blockquote>
                      <figcaption className="mt-4 text-xs uppercase tracking-[0.16em]">
                        <span className="font-semibold">{m.name}</span>
                        <span className="muted"> · {formatDate(m.created_at, timezone, { day: "2-digit", month: "short" })}</span>
                      </figcaption>
                    </figure>
                  </Reveal>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </SectionShell>
  );
}
