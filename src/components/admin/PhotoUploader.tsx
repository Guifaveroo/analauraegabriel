"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { compressImage, ACCEPTED_TYPES } from "@/lib/images/compress";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { PHOTOS_BUCKET } from "@/lib/env";
import { registerPhoto } from "@/app/admin/actions/photos";
import { ALBUMS, ALBUM_LABELS, type Album } from "@/lib/admin/albums";

type Item = { name: string; status: "waiting" | "working" | "done" | "error"; message?: string };

type Props = {
  defaultAlbum?: Album;
  lockAlbum?: boolean;
  multiple?: boolean;
  onUploaded?: (ids: string[]) => void;
  compact?: boolean;
};

/** Envio de várias fotos com compressão no navegador e upload direto ao Supabase Storage. */
export function PhotoUploader({ defaultAlbum = "library", lockAlbum, multiple = true, onUploaded, compact }: Props) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [album, setAlbum] = useState<Album>(defaultAlbum);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  const handle = async (files: FileList | File[]) => {
    const list = Array.from(files).slice(0, multiple ? 30 : 1);
    if (list.length === 0) return;
    setBusy(true);
    setItems(list.map((f) => ({ name: f.name, status: "waiting" })));
    const supabase = createBrowserSupabase();
    const uploaded: string[] = [];

    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      const update = (patch: Partial<Item>) => setItems((cur) => cur.map((it, j) => (j === i ? { ...it, ...patch } : it)));
      update({ status: "working" });
      try {
        const img = await compressImage(file);
        const id = crypto.randomUUID();
        const opts = { contentType: "image/webp", cacheControl: "31536000", upsert: false };
        const [a, b] = await Promise.all([
          supabase.storage.from(PHOTOS_BUCKET).upload(`full/${id}.webp`, img.full, opts),
          supabase.storage.from(PHOTOS_BUCKET).upload(`thumb/${id}.webp`, img.thumb, opts),
        ]);
        if (a.error || b.error) throw new Error((a.error ?? b.error)!.message);
        const caption = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").slice(0, 120);
        const res = await registerPhoto({ id, album, width: img.width, height: img.height, caption: /^(img|dsc|photo|whatsapp)/i.test(caption) ? "" : caption });
        if (!res.ok) throw new Error(res.error);
        uploaded.push(id);
        update({ status: "done" });
      } catch (e) {
        update({ status: "error", message: e instanceof Error ? e.message : "Falha no envio" });
      }
    }

    setBusy(false);
    if (input.current) input.current.value = "";
    if (uploaded.length) {
      onUploaded?.(uploaded);
      router.refresh();
    }
  };

  return (
    <div className={compact ? "" : "admin-card p-5"}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        {!lockAlbum && (
          <div className="sm:w-56">
            <label htmlFor="upload-album" className="admin-label">Álbum</label>
            <select id="upload-album" className="admin-input" value={album} onChange={(e) => setAlbum(e.target.value as Album)}>
              {ALBUMS.map((a) => <option key={a} value={a}>{ALBUM_LABELS[a]}</option>)}
            </select>
          </div>
        )}
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            if (!busy) handle(e.dataTransfer.files);
          }}
          className={`flex min-h-24 flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 text-center text-sm transition ${
            drag ? "border-stone-900 bg-stone-100" : "border-stone-300 hover:border-stone-500"
          } ${busy ? "pointer-events-none opacity-60" : ""}`}
        >
          <span className="font-semibold">{busy ? "Enviando…" : multiple ? "Escolher fotos ou arrastar aqui" : "Escolher foto"}</span>
          <span className="mt-1 text-xs text-stone-500">JPG, PNG ou WebP · otimizadas automaticamente</span>
          <input
            ref={input}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            multiple={multiple}
            className="sr-only"
            disabled={busy}
            onChange={(e) => e.target.files && handle(e.target.files)}
          />
        </label>
      </div>
      {items.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm">
          {items.map((it, i) => (
            <li key={i} className="flex items-center gap-2">
              <span aria-hidden className="w-4">
                {it.status === "done" ? "✓" : it.status === "error" ? "✕" : it.status === "working" ? "…" : "·"}
              </span>
              <span className="truncate">{it.name}</span>
              {it.message && <span className="text-red-700">— {it.message}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
