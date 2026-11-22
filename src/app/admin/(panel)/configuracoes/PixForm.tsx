"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { ActionForm } from "@/components/admin/ActionForm";
import { savePix } from "@/app/admin/actions/settings";
import { buildPixPayload, type PixKeyType } from "@/lib/pix/brcode";

const TYPES: { value: PixKeyType; label: string; placeholder: string }[] = [
  { value: "cpf", label: "CPF", placeholder: "000.000.000-00" },
  { value: "cnpj", label: "CNPJ", placeholder: "00.000.000/0000-00" },
  { value: "email", label: "E-mail", placeholder: "voces@email.com" },
  { value: "phone", label: "Telefone", placeholder: "(11) 98765-4321" },
  { value: "random", label: "Chave aleatória", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
];

export function PixForm({ initial }: { initial: { type: PixKeyType; key: string; beneficiary: string; city: string } }) {
  const [type, setType] = useState<PixKeyType>(initial.type);
  const [key, setKey] = useState(initial.key);
  const [beneficiary, setBeneficiary] = useState(initial.beneficiary);
  const [city, setCity] = useState(initial.city);
  const [qr, setQr] = useState<string | null>(null);

  const test = useMemo(() => {
    try {
      return { payload: buildPixPayload({ keyType: type, key, beneficiary, city, amount: 1, txid: "TESTE" }), error: null };
    } catch (e) {
      return { payload: null, error: key ? (e as Error).message : null };
    }
  }, [type, key, beneficiary, city]);

  useEffect(() => {
    let alive = true;
    if (test.payload) QRCode.toDataURL(test.payload, { margin: 1, width: 320 }).then((d) => alive && setQr(d));
    return () => {
      alive = false;
    };
  }, [test.payload]);

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_220px]">
      <ActionForm action={savePix} submitLabel="Salvar chave PIX">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pix_key_type" className="admin-label">Tipo de chave</label>
            <select id="pix_key_type" name="pix_key_type" value={type} onChange={(e) => setType(e.target.value as PixKeyType)} className="admin-input">
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="pix_key" className="admin-label">Chave PIX</label>
            <input id="pix_key" name="pix_key" value={key} onChange={(e) => setKey(e.target.value)} placeholder={TYPES.find((t) => t.value === type)?.placeholder} className="admin-input" autoComplete="off" />
          </div>
          <div>
            <label htmlFor="pix_beneficiary" className="admin-label">Nome do beneficiário</label>
            <input id="pix_beneficiary" name="pix_beneficiary" value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} className="admin-input" />
            <p className="mt-1 text-xs text-stone-500">Como aparece no banco (até 25 letras, sem acentos no código).</p>
          </div>
          <div>
            <label htmlFor="pix_city" className="admin-label">Cidade do beneficiário</label>
            <input id="pix_city" name="pix_city" value={city} onChange={(e) => setCity(e.target.value)} className="admin-input" />
          </div>
        </div>
        {test.error && <p className="mt-3 text-sm text-red-700">{test.error}</p>}
      </ActionForm>
      <div className="text-center">
        <p className="admin-label">QR Code de teste (R$ 1,00)</p>
        {test.payload && qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="QR Code PIX de teste" className="mx-auto w-full max-w-[220px] rounded-lg border border-stone-200" />
        ) : (
          <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-stone-300 text-xs text-stone-400">
            Preencha os dados
          </div>
        )}
        <p className="mt-2 text-xs text-stone-500">Escaneie com o app do banco e confira nome e valor antes de pagar.</p>
      </div>
    </div>
  );
}
