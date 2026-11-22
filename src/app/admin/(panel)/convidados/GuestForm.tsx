"use client";

import { ActionForm } from "@/components/admin/ActionForm";
import { saveGuest } from "@/app/admin/actions/guests";
import type { GroupRow, GuestRow } from "@/lib/admin/queries";

export function GuestForm({ guest, families, categories, onDone }: { guest?: GuestRow; families: GroupRow[]; categories: GroupRow[]; onDone?: () => void }) {
  const p = guest?.id ?? "new";
  return (
    <ActionForm action={saveGuest} resetOnSuccess={!guest} onSuccess={onDone} submitLabel={guest ? "Salvar" : "Adicionar"} className="text-left">
      {guest && <input type="hidden" name="id" value={guest.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={`${p}-name`} className="admin-label">Nome completo</label>
          <input id={`${p}-name`} name="name" required defaultValue={guest?.name} className="admin-input" />
        </div>
        <div>
          <label htmlFor={`${p}-family`} className="admin-label">Família</label>
          <select id={`${p}-family`} name="family_id" defaultValue={guest?.family_id ?? ""} className="admin-input">
            <option value="">Sem família</option>
            {families.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`${p}-cat`} className="admin-label">Grupo</label>
          <select id={`${p}-cat`} name="category_id" defaultValue={guest?.category_id ?? ""} className="admin-input">
            <option value="">Sem grupo</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`${p}-comp`} className="admin-label">Acompanhantes permitidos</label>
          <input id={`${p}-comp`} name="max_companions" type="number" min={0} max={20} defaultValue={guest?.max_companions ?? 0} className="admin-input" />
        </div>
        <div>
          <label htmlFor={`${p}-phone`} className="admin-label">Telefone (opcional)</label>
          <input id={`${p}-phone`} name="phone" defaultValue={guest?.phone} className="admin-input" />
        </div>
        <div>
          <label htmlFor={`${p}-email`} className="admin-label">E-mail (opcional)</label>
          <input id={`${p}-email`} name="email" type="email" defaultValue={guest?.email} className="admin-input" />
        </div>
        <div>
          <label htmlFor={`${p}-notes`} className="admin-label">Observações</label>
          <input id={`${p}-notes`} name="notes" defaultValue={guest?.notes} className="admin-input" />
        </div>
      </div>
    </ActionForm>
  );
}
