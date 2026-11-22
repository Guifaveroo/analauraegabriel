"use client";

import { useState } from "react";
import type { Photo } from "@/lib/types";
import { storageUrl } from "@/lib/photos";
import { ALBUMS, ALBUM_LABELS } from "@/lib/admin/albums";
import { ActionButton, ActionForm } from "@/components/admin/ActionForm";
import { deletePhoto, movePhoto, setFeaturedPhoto, updatePhoto } from "@/app/admin/actions/photos";

export function PhotoCard({ photo }: { photo: Photo }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="admin-card overflow-hidden">
      <div className="relative aspect-square bg-stone-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={storageUrl(photo.thumb_path)} alt={photo.caption} loading="lazy" className="h-full w-full object-cover" />
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[0.65rem] font-semibold">
          {ALBUM_LABELS[photo.album as keyof typeof ALBUM_LABELS] ?? photo.album}
        </span>
        {photo.is_featured && <span className="absolute right-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-xs" title="Imagem principal">★</span>}
      </div>
      <div className="p-3">
        {editing ? (
          <ActionForm action={updatePhoto} onSuccess={() => setEditing(false)} className="space-y-2">
            <input type="hidden" name="id" value={photo.id} />
            <input name="caption" defaultValue={photo.caption} placeholder="Legenda" maxLength={300} className="admin-input" aria-label="Legenda" />
            <select name="album" defaultValue={photo.album} className="admin-input" aria-label="Álbum">
              {ALBUMS.map((a) => <option key={a} value={a}>{ALBUM_LABELS[a]}</option>)}
            </select>
          </ActionForm>
        ) : (
          <p className="line-clamp-1 min-h-5 text-sm text-stone-600">{photo.caption || <span className="text-stone-400">Sem legenda</span>}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-1">
          <button type="button" className="admin-btn admin-btn-secondary !min-h-8 !px-2 text-xs" onClick={() => setEditing((v) => !v)}>
            {editing ? "Fechar" : "Editar"}
          </button>
          <ActionButton action={() => movePhoto(photo.id, -1)} className="admin-btn admin-btn-secondary !min-h-8 !px-2 text-xs" title="Mover para antes">←</ActionButton>
          <ActionButton action={() => movePhoto(photo.id, 1)} className="admin-btn admin-btn-secondary !min-h-8 !px-2 text-xs" title="Mover para depois">→</ActionButton>
          {!photo.is_featured && (
            <ActionButton action={() => setFeaturedPhoto(photo.id)} className="admin-btn admin-btn-secondary !min-h-8 !px-2 text-xs" title="Definir como principal">★</ActionButton>
          )}
          <ActionButton
            action={() => deletePhoto(photo.id)}
            className="admin-btn admin-btn-danger !min-h-8 !px-2 text-xs"
            confirm="Excluir esta foto? Ela será removida de todas as seções em que estiver sendo usada."
          >
            Excluir
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
