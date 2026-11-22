"use client";

import { useEffect, useState, useTransition } from "react";
import type { SectionContentMap, ThemeTokens } from "@/lib/content/schemas";
import type { WeddingSettings } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { lookupInvite, submitRsvp, type RsvpGuest } from "@/app/(site)/actions";
import { SectionShell } from "./SectionShell";
import { Reveal } from "./Reveal";
import { Consent, FormError, PreviewNotice, SpamFields } from "./FormBits";

type Props = {
  content: SectionContentMap["rsvp"];
  settings: WeddingSettings;
  decoration: ThemeTokens["decoration"];
  preview?: boolean;
};

type Answer = { guestId: string | null; name: string; attending: boolean | null; companions: string[]; dietary: string; notes: string };

function emptyAnswer(guest?: RsvpGuest): Answer {
  const r = guest?.response;
  return {
    guestId: guest?.id ?? null,
    name: guest?.name ?? "",
    attending: r ? r.attending : null,
    companions: r?.companions ?? [],
    dietary: r?.dietary ?? "",
    notes: r?.notes ?? "",
  };
}

function AnswerFields({
  answer,
  max,
  onChange,
  showName,
  idPrefix,
}: {
  answer: Answer;
  max: number;
  onChange: (a: Answer) => void;
  showName: boolean;
  idPrefix: string;
}) {
  const set = (patch: Partial<Answer>) => onChange({ ...answer, ...patch });
  return (
    <div className="space-y-5">
      {showName ? (
        <div>
          <label htmlFor={`${idPrefix}-name`} className="label">Nome completo</label>
          <input id={`${idPrefix}-name`} required minLength={2} maxLength={120} autoComplete="name" className="field" value={answer.name} onChange={(e) => set({ name: e.target.value })} />
        </div>
      ) : (
        <p className="font-heading text-2xl">{answer.name}</p>
      )}

      <fieldset>
        <legend className="label">Você irá ao casamento?</legend>
        <div className="grid grid-cols-2 gap-3">
          {[
            [true, "Sim, estarei lá"],
            [false, "Não poderei ir"],
          ].map(([value, label]) => (
            <label
              key={String(value)}
              className={`flex min-h-12 cursor-pointer items-center justify-center rounded-lg border px-3 text-center text-sm transition ${
                answer.attending === value ? "border-primary bg-primary text-white" : "border-primary/25 hover:border-primary"
              }`}
            >
              <input type="radio" className="sr-only" name={`${idPrefix}-attending`} required checked={answer.attending === value} onChange={() => set({ attending: value as boolean })} />
              {label as string}
            </label>
          ))}
        </div>
      </fieldset>

      {answer.attending && max > 0 && (
        <div className="space-y-3">
          <label htmlFor={`${idPrefix}-count`} className="label">Acompanhantes (até {max})</label>
          <select
            id={`${idPrefix}-count`}
            className="field"
            value={answer.companions.length}
            onChange={(e) => {
              const n = Number(e.target.value);
              set({ companions: Array.from({ length: n }, (_, i) => answer.companions[i] ?? "") });
            }}
          >
            {Array.from({ length: max + 1 }, (_, i) => (
              <option key={i} value={i}>{i === 0 ? "Nenhum" : i}</option>
            ))}
          </select>
          {answer.companions.map((c, i) => (
            <input
              key={i}
              aria-label={`Nome do acompanhante ${i + 1}`}
              placeholder={`Nome do acompanhante ${i + 1}`}
              required
              maxLength={120}
              className="field"
              value={c}
              onChange={(e) => set({ companions: answer.companions.map((x, j) => (j === i ? e.target.value : x)) })}
            />
          ))}
        </div>
      )}

      {answer.attending && (
        <div>
          <label htmlFor={`${idPrefix}-diet`} className="label">Restrições alimentares <span className="font-normal opacity-60">(opcional)</span></label>
          <input id={`${idPrefix}-diet`} maxLength={500} className="field" value={answer.dietary} onChange={(e) => set({ dietary: e.target.value })} />
        </div>
      )}
      <div>
        <label htmlFor={`${idPrefix}-notes`} className="label">Observações <span className="font-normal opacity-60">(opcional)</span></label>
        <textarea id={`${idPrefix}-notes`} maxLength={1000} rows={2} className="field" value={answer.notes} onChange={(e) => set({ notes: e.target.value })} />
      </div>
    </div>
  );
}

export function Rsvp({ content, settings, decoration, preview }: Props) {
  const closedMode = settings.rsvp_mode === "closed";
  const deadlinePassed = settings.rsvp_deadline ? new Date(settings.rsvp_deadline).getTime() < Date.now() : false;

  const [code, setCode] = useState("");
  const [lookupName, setLookupName] = useState("");
  const [guests, setGuests] = useState<RsvpGuest[] | null>(null);
  const [family, setFamily] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answer[]>(closedMode ? [] : [emptyAnswer()]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const runLookup = (c: string, n: string) => {
    if (preview) return;
    setError(null);
    startTransition(async () => {
      const res = await lookupInvite(c, n);
      if (!res.ok) return setError(res.error);
      setGuests(res.data.guests);
      setFamily(res.data.family);
      setAnswers(res.data.guests.map((g) => emptyAnswer(g)));
    });
  };

  // link do convite: ?convite=CODIGO
  useEffect(() => {
    if (!closedMode || preview) return;
    const c = new URLSearchParams(window.location.search).get("convite");
    if (c) {
      setCode(c);
      runLookup(c, "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locked = Boolean(guests && !settings.rsvp_allow_edit && guests.every((g) => g.response));

  const submit = (form: FormData) => {
    if (preview) return;
    setError(null);
    if (answers.some((a) => a.attending === null)) return setError("Responda se cada convidado irá ao casamento.");
    form.set(
      "responses",
      JSON.stringify(
        answers
          .filter((a, i) => settings.rsvp_allow_edit || !guests?.[i]?.response)
          .map((a) => ({ ...a, companions: a.attending ? a.companions : [] })),
      ),
    );
    startTransition(async () => {
      const res = await submitRsvp(form);
      if (!res.ok) return setError(res.error);
      setDone(true);
    });
  };

  return (
    <SectionShell id="rsvp" eyebrow="RSVP" title={content.title} subtitle={content.subtitle} decoration={decoration}>
      <Reveal className="card mx-auto max-w-xl p-6 sm:p-10">
        {settings.rsvp_deadline && !deadlinePassed && (
          <p className="eyebrow mb-6 text-center !tracking-[0.2em]">
            Confirme até {formatDate(settings.rsvp_deadline, settings.timezone)}
          </p>
        )}

        {deadlinePassed ? (
          <p className="text-center leading-7">O prazo para confirmação foi encerrado. Em caso de dúvidas, fale diretamente com os noivos.</p>
        ) : done ? (
          <div className="py-6 text-center">
            <p className="text-4xl text-primary" aria-hidden>♡</p>
            <p className="mt-4 font-heading text-2xl">{content.thankYou}</p>
          </div>
        ) : closedMode && !guests ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runLookup(code, lookupName);
            }}
            className="space-y-5"
          >
            <p className="muted text-center text-sm leading-6">
              Use o link recebido no seu convite ou digite o código. Se preferir, informe seu nome completo.
            </p>
            <div>
              <label htmlFor="rsvp-code" className="label">Código do convite</label>
              <input id="rsvp-code" className="field uppercase" maxLength={40} value={code} onChange={(e) => setCode(e.target.value)} autoCapitalize="characters" />
            </div>
            <div className="flex items-center gap-4 text-xs uppercase tracking-[0.2em] opacity-60">
              <span className="h-px flex-1 bg-current" /> ou <span className="h-px flex-1 bg-current" />
            </div>
            <div>
              <label htmlFor="rsvp-lookup-name" className="label">Nome completo</label>
              <input id="rsvp-lookup-name" className="field" maxLength={120} autoComplete="name" value={lookupName} onChange={(e) => setLookupName(e.target.value)} />
            </div>
            <FormError message={error} />
            {preview && <PreviewNotice />}
            <button type="submit" className="btn w-full" disabled={pending || preview}>
              {pending ? "Buscando…" : "Encontrar meu convite"}
            </button>
          </form>
        ) : locked ? (
          <div className="space-y-4 text-center">
            <p className="font-heading text-2xl">Resposta já registrada</p>
            <ul className="space-y-1 text-sm">
              {guests!.map((g) => (
                <li key={g.id}>
                  {g.name}: <strong>{g.response?.attending ? "confirmado" : "não comparecerá"}</strong>
                </li>
              ))}
            </ul>
            <p className="muted text-xs">Para alterar, fale diretamente com os noivos.</p>
          </div>
        ) : (
          <form action={submit} className="space-y-8">
            <SpamFields />
            {family && <p className="eyebrow text-center">{family}</p>}
            {answers.map((a, i) => {
              const g = guests?.[i];
              const readOnly = Boolean(g?.response && !settings.rsvp_allow_edit);
              return (
                <div key={a.guestId ?? i} className={i > 0 ? "border-t hairline pt-8" : ""}>
                  {readOnly ? (
                    <p className="text-sm">
                      <span className="font-heading text-2xl">{a.name}</span> — resposta já registrada.
                    </p>
                  ) : (
                    <AnswerFields
                      idPrefix={`rsvp-${i}`}
                      answer={a}
                      max={g ? g.max_companions : settings.open_rsvp_max_companions}
                      showName={!closedMode}
                      onChange={(next) => setAnswers((list) => list.map((x, j) => (j === i ? next : x)))}
                    />
                  )}
                </div>
              );
            })}
            <Consent>Autorizo o uso destes dados exclusivamente para a organização do casamento.</Consent>
            <FormError message={error} />
            {preview && <PreviewNotice />}
            <button type="submit" className="btn w-full" disabled={pending || preview}>
              {pending ? "Enviando…" : "Enviar confirmação"}
            </button>
          </form>
        )}
      </Reveal>
    </SectionShell>
  );
}
