"use client";

import { useState } from "react";
import { ActionButton } from "@/components/admin/ActionForm";
import { deleteGuest } from "@/app/admin/actions/guests";
import type { GroupRow, GuestRow } from "@/lib/admin/queries";
import { GuestForm } from "./GuestForm";

export function GuestRowActions({ guest, families, categories }: { guest: GuestRow; families: GroupRow[]; categories: GroupRow[] }) {
  const [editing, setEditing] = useState(false);
  return (
    <>
      <div className="flex justify-end gap-1">
        <button type="button" className="admin-btn admin-btn-secondary !min-h-8 !px-2 text-xs" onClick={() => setEditing(true)}>Editar</button>
        <ActionButton action={() => deleteGuest(guest.id)} confirm={`Excluir ${guest.name}? A resposta de presença também será apagada.`} className="admin-btn admin-btn-danger !min-h-8 !px-2 text-xs">
          Excluir
        </ActionButton>
      </div>
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6" onClick={() => setEditing(false)}>
          <div role="dialog" aria-modal="true" aria-label="Editar convidado" className="w-full max-w-lg rounded-t-2xl bg-white p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Editar convidado</h2>
              <button type="button" onClick={() => setEditing(false)} className="h-10 w-10 text-2xl" aria-label="Fechar">×</button>
            </div>
            <GuestForm guest={guest} families={families} categories={categories} onDone={() => setEditing(false)} />
          </div>
        </div>
      )}
    </>
  );
}
