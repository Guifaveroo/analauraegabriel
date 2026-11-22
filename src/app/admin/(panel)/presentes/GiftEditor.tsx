"use client";

import { useState } from "react";
import { ActionForm } from "@/components/admin/ActionForm";
import { PhotoField } from "@/components/admin/editor/fields";
import { saveGift } from "@/app/admin/actions/gifts";
import type { Gift, GiftMode, Photo } from "@/lib/types";

type Props = { gift?: Gift; photos: Photo[]; categories: string[]; asDialog?: boolean };

function GiftForm({ gift, photos, categories, onDone }: Props & { onDone?: () => void }) {
  const [mode, setMode] = useState<GiftMode>(gift?.mode ?? "single");
  const [photoId, setPhotoId] = useState<string | null>(gift?.photo_id ?? null);
  const p = gift?.id ?? "new";
  return (
    <ActionForm action={saveGift} resetOnSuccess={!gift} onSuccess={() => { if (!gift) setPhotoId(null); onDone?.(); }} submitLabel={gift ? "Salvar" : "Cadastrar presente"}>
      {gift && <input type="hidden" name="id" value={gift.id} />}
      <input type="hidden" name="photo_id" value={photoId ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={`${p}-name`} className="admin-label">Nome</label>
          <input id={`${p}-name`} name="name" required defaultValue={gift?.name} className="admin-input" placeholder="Jantar romântico" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${p}-desc`} className="admin-label">Descrição</label>
          <textarea id={`${p}-desc`} name="description" rows={2} maxLength={1000} defaultValue={gift?.description} className="admin-input" />
        </div>
        <div>
          <label htmlFor={`${p}-cat`} className="admin-label">Categoria</label>
          <input id={`${p}-cat`} name="category" list={`${p}-cats`} defaultValue={gift?.category} className="admin-input" placeholder="Experiências" />
          <datalist id={`${p}-cats`}>{categories.map((c) => <option key={c} value={c} />)}</datalist>
        </div>
        <div>
          <label htmlFor={`${p}-price`} className="admin-label">Valor (R$)</label>
          <input id={`${p}-price`} name="price" required inputMode="decimal" defaultValue={gift ? Number(gift.price).toFixed(2).replace(".", ",") : ""} className="admin-input" placeholder="250,00" />
        </div>
        <div>
          <label htmlFor={`${p}-mode`} className="admin-label">Disponibilidade</label>
          <select id={`${p}-mode`} name="mode" value={mode} onChange={(e) => setMode(e.target.value as GiftMode)} className="admin-input">
            <option value="single">Presenteado apenas uma vez</option>
            <option value="limited">Quantidade limitada</option>
            <option value="unlimited">Várias contribuições (ilimitado)</option>
          </select>
        </div>
        {mode === "limited" && (
          <div>
            <label htmlFor={`${p}-qty`} className="admin-label">Quantidade disponível</label>
            <input id={`${p}-qty`} name="quantity" type="number" min={1} max={1000} required defaultValue={gift?.quantity ?? 2} className="admin-input" />
          </div>
        )}
        <div className="sm:col-span-2">
          <PhotoField label="Fotografia" value={photoId} onChange={setPhotoId} photos={photos} album="gifts" />
        </div>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="active" defaultChecked={gift?.active ?? true} className="h-5 w-5 accent-stone-900" />
          Exibir na lista
        </label>
      </div>
    </ActionForm>
  );
}

export function GiftEditor(props: Props) {
  const [open, setOpen] = useState(false);
  if (!props.asDialog) return <GiftForm {...props} />;
  return (
    <>
      <button type="button" className="admin-btn admin-btn-secondary !min-h-8 !px-2 text-xs" onClick={() => setOpen(true)}>Editar</button>
      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center sm:p-6" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Editar presente" className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Editar presente</h2>
              <button type="button" onClick={() => setOpen(false)} className="h-10 w-10 text-2xl" aria-label="Fechar">×</button>
            </div>
            <GiftForm {...props} onDone={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
