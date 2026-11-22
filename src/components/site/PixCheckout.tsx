"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import type { GiftWithStock, Photo } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { photoSources } from "@/lib/photos";
import { createGiftOrder, type GiftOrderView } from "@/app/(site)/actions";
import { Consent, FormError, PreviewNotice, SpamFields } from "./FormBits";

type Props = {
  gift: GiftWithStock;
  photo?: Photo;
  thankYou: string;
  preview?: boolean;
  onClose: () => void;
};

type Step = "form" | "pay" | "done";

export function PixCheckout({ gift, photo, thankYou, preview, onClose }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<GiftOrderView | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    if (!order) return;
    QRCode.toDataURL(order.payload, { errorCorrectionLevel: "M", margin: 1, width: 560, color: { dark: "#111111", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [order]);

  const submit = (form: FormData) => {
    if (preview) return;
    setError(null);
    startTransition(async () => {
      const res = await createGiftOrder(form);
      if (!res.ok) {
        setError(res.error);
        router.refresh();
        return;
      }
      setOrder(res.data);
      setStep("pay");
      router.refresh();
    });
  };

  const copy = async () => {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.payload);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = order.payload;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const src = photo ? photoSources(photo) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-[2px] sm:items-center sm:p-6" onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pix-title"
        onClick={(e) => e.stopPropagation()}
        className="site relative max-h-[94dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-surface !min-h-0 shadow-2xl outline-none sm:rounded-2xl"
      >
        <button type="button" onClick={onClose} className="absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center text-2xl opacity-70 hover:opacity-100" aria-label="Fechar">
          ×
        </button>

        <div className="flex items-center gap-4 border-b hairline p-5 pr-12">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src.thumb} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-secondary/25 text-2xl text-primary">❦</div>
          )}
          <div>
            <h2 id="pix-title" className="font-heading text-2xl leading-tight">{gift.name}</h2>
            <p className="font-heading text-xl text-primary">{formatCurrency(gift.price)}</p>
          </div>
        </div>

        {step === "form" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(new FormData(e.currentTarget));
            }}
            className="space-y-5 p-5 sm:p-7"
          >
            {gift.description && <p className="muted text-sm leading-6">{gift.description}</p>}
            <input type="hidden" name="giftId" value={gift.id} />
            <SpamFields />
            <div>
              <label htmlFor="pix-name" className="label">Seu nome</label>
              <input id="pix-name" name="name" required minLength={2} maxLength={120} autoComplete="name" className="field" />
            </div>
            <div>
              <label htmlFor="pix-email" className="label">E-mail <span className="font-normal opacity-60">(opcional)</span></label>
              <input id="pix-email" name="email" type="email" maxLength={200} autoComplete="email" className="field" />
            </div>
            <Consent>Concordo que meu nome seja usado pelos noivos para identificar o presente.</Consent>
            <FormError message={error} />
            {preview && <PreviewNotice />}
            <button type="submit" className="btn w-full" disabled={pending || preview}>
              {pending ? "Gerando PIX…" : "Continuar para o PIX"}
            </button>
          </form>
        )}

        {step === "pay" && order && (
          <div className="space-y-5 p-5 text-center sm:p-7">
            <p className="text-sm leading-6">
              Abra o aplicativo do seu banco, escolha <strong>Pix → Ler QR Code</strong> ou <strong>Pix Copia e Cola</strong>.
            </p>
            <div className="mx-auto w-full max-w-[260px] rounded-xl border hairline bg-white p-3">
              {qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr} alt={`QR Code PIX de ${formatCurrency(order.amount)}`} className="h-auto w-full" />
              ) : (
                <div className="aspect-square w-full animate-pulse bg-black/5" />
              )}
            </div>

            <dl className="grid grid-cols-2 gap-3 text-left text-sm">
              <div className="rounded-lg bg-bg p-3">
                <dt className="text-[0.65rem] uppercase tracking-[0.14em] opacity-60">Valor</dt>
                <dd className="font-semibold">{formatCurrency(order.amount)}</dd>
              </div>
              <div className="rounded-lg bg-bg p-3">
                <dt className="text-[0.65rem] uppercase tracking-[0.14em] opacity-60">Beneficiário</dt>
                <dd className="truncate font-semibold">{order.beneficiary}</dd>
              </div>
            </dl>

            <div className="text-left">
              <label htmlFor="pix-code" className="label">PIX copia e cola</label>
              <textarea
                id="pix-code"
                readOnly
                value={order.payload}
                rows={3}
                onFocus={(e) => e.currentTarget.select()}
                className="field resize-none break-all font-mono !text-xs leading-5"
              />
            </div>
            <button type="button" onClick={copy} className="btn w-full" aria-live="polite">
              {copied ? "Código copiado ✓" : "Copiar código PIX"}
            </button>

            <p className="muted text-xs leading-5">
              Identificador: <span className="font-mono">{order.txid}</span>. Seu presente fica registrado como
              <strong> aguardando confirmação</strong> até que os noivos confirmem o recebimento. Não é preciso enviar comprovante.
            </p>
            <button type="button" onClick={() => setStep("done")} className="btn btn-ghost w-full">
              Já fiz o PIX
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-5 p-8 text-center">
            <p className="text-4xl text-primary" aria-hidden>♡</p>
            <h3 className="font-heading text-3xl">Obrigado!</h3>
            <p className="muted leading-7">{thankYou}</p>
            <button type="button" onClick={onClose} className="btn w-full">Voltar ao site</button>
          </div>
        )}
      </div>
    </div>
  );
}
