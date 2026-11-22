"use client";

import { useState, type ReactNode } from "react";
import type { Photo } from "@/lib/types";
import { storageUrl } from "@/lib/photos";
import { PhotoUploader } from "../PhotoUploader";
import type { Album } from "@/lib/admin/albums";

let uid = 0;
const nextId = (p: string) => `${p}-${++uid}`;

export function TextField({ label, value, onChange, max = 200, placeholder }: { label: string; value: string; onChange: (v: string) => void; max?: number; placeholder?: string }) {
  const [id] = useState(() => nextId("f"));
  return (
    <div>
      <label htmlFor={id} className="admin-label">{label}</label>
      <input id={id} className="admin-input" value={value} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function TextArea({ label, value, onChange, max = 2000, rows = 4, hint }: { label: string; value: string; onChange: (v: string) => void; max?: number; rows?: number; hint?: string }) {
  const [id] = useState(() => nextId("t"));
  return (
    <div>
      <label htmlFor={id} className="admin-label">{label}</label>
      <textarea id={id} className="admin-input" rows={rows} value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} />
      <p className="mt-0.5 flex justify-between text-[0.7rem] text-stone-400">
        <span>{hint ?? "Deixe uma linha em branco para separar parágrafos."}</span>
        <span>{value.length}/{max}</span>
      </p>
    </div>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 py-1 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-stone-900" />
      <span>
        {label}
        {hint && <span className="block text-xs text-stone-500">{hint}</span>}
      </span>
    </label>
  );
}

export function Range({ label, value, onChange, min = 0, max = 100, suffix = "" }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; suffix?: string }) {
  const [id] = useState(() => nextId("r"));
  return (
    <div>
      <label htmlFor={id} className="admin-label flex justify-between">
        <span>{label}</span>
        <span className="tabular-nums text-stone-500">{value}{suffix}</span>
      </label>
      <input id={id} type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-stone-900" />
    </div>
  );
}

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Seletor de cor visual + código HEX. */
export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value);
  const [id] = useState(() => nextId("c"));
  const [last, setLast] = useState(value);
  if (value !== last) {
    setLast(value);
    setText(value);
  }
  return (
    <div>
      <label htmlFor={id} className="admin-label">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} (seletor)`}
          value={HEX.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-stone-300 bg-white p-1"
        />
        <input
          id={id}
          className={`admin-input font-mono uppercase ${HEX.test(text) ? "" : "!border-red-400"}`}
          value={text}
          maxLength={7}
          onChange={(e) => {
            const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
            setText(v);
            if (HEX.test(v)) onChange(v.toLowerCase());
          }}
        />
      </div>
    </div>
  );
}

export function ColorList({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <p className="admin-label">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        {value.map((c, i) => (
          <div key={i} className="flex items-center gap-1 rounded-full border border-stone-200 bg-white py-1 pl-1 pr-2">
            <input
              type="color"
              value={c}
              aria-label={`Cor ${i + 1}`}
              onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))}
              className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
            />
            <span className="font-mono text-xs uppercase">{c}</span>
            <button type="button" aria-label="Remover cor" className="ml-1 text-stone-400 hover:text-red-600" onClick={() => onChange(value.filter((_, j) => j !== i))}>
              ×
            </button>
          </div>
        ))}
        {value.length < 12 && (
          <button type="button" className="admin-btn admin-btn-secondary !min-h-9 text-xs" onClick={() => onChange([...value, "#c9b48a"])}>
            + Cor
          </button>
        )}
      </div>
    </div>
  );
}

/** Lista editável genérica (linha do tempo, horários, perguntas…). */
export function ListEditor<T extends { id: string }>({
  label,
  items,
  onChange,
  create,
  render,
  max = 30,
  addLabel = "Adicionar",
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  create: () => T;
  render: (item: T, update: (patch: Partial<T>) => void) => ReactNode;
  max?: number;
  addLabel?: string;
}) {
  const move = (i: number, d: number) => {
    const next = [...items];
    const [it] = next.splice(i, 1);
    next.splice(i + d, 0, it);
    onChange(next);
  };
  return (
    <div>
      <p className="admin-label">{label}</p>
      <ol className="space-y-3">
        {items.map((item, i) => (
          <li key={item.id} className="rounded-lg border border-stone-200 bg-stone-50/60 p-3">
            <div className="mb-2 flex items-center justify-between text-xs text-stone-500">
              <span>#{i + 1}</span>
              <span className="flex gap-1">
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="h-7 w-7 rounded hover:bg-stone-200 disabled:opacity-30" aria-label="Subir">↑</button>
                <button type="button" disabled={i === items.length - 1} onClick={() => move(i, 1)} className="h-7 w-7 rounded hover:bg-stone-200 disabled:opacity-30" aria-label="Descer">↓</button>
                <button type="button" onClick={() => onChange(items.filter((x) => x.id !== item.id))} className="h-7 w-7 rounded text-red-600 hover:bg-red-50" aria-label="Remover">×</button>
              </span>
            </div>
            <div className="space-y-2">{render(item, (patch) => onChange(items.map((x) => (x.id === item.id ? { ...x, ...patch } : x))))}</div>
          </li>
        ))}
      </ol>
      {items.length < max && (
        <button type="button" className="admin-btn admin-btn-secondary mt-3 w-full" onClick={() => onChange([...items, create()])}>
          + {addLabel}
        </button>
      )}
    </div>
  );
}

export const newId = () => Math.random().toString(36).slice(2, 10);

// Fotos ----------------------------------------------------------------------
function PhotoPicker({ photos, onPick, onClose, album, multiple }: { photos: Photo[]; onPick: (ids: string[]) => void; onClose: () => void; album: Album; multiple?: boolean }) {
  const [filter, setFilter] = useState<"album" | "all">("album");
  const list = filter === "album" ? photos.filter((p) => p.album === album) : photos;
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Escolher foto" className="flex max-h-[90dvh] w-full max-w-3xl flex-col rounded-t-2xl bg-white sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-stone-200 p-4">
          <h2 className="font-semibold">Escolher foto</h2>
          <button type="button" onClick={onClose} className="h-10 w-10 text-2xl" aria-label="Fechar">×</button>
        </div>
        <div className="overflow-y-auto p-4">
          <PhotoUploader compact defaultAlbum={album} lockAlbum multiple={multiple} onUploaded={(ids) => (multiple ? setSelected((s) => [...s, ...ids]) : onPick(ids))} />
          <div className="my-4 flex gap-2 text-sm">
            <button type="button" onClick={() => setFilter("album")} className={`rounded-full px-3 py-1 ${filter === "album" ? "bg-stone-900 text-white" : "bg-stone-100"}`}>Deste álbum</button>
            <button type="button" onClick={() => setFilter("all")} className={`rounded-full px-3 py-1 ${filter === "all" ? "bg-stone-900 text-white" : "bg-stone-100"}`}>Todas as fotos</button>
          </div>
          {list.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-500">Nenhuma foto. Envie acima ou veja &quot;Todas as fotos&quot;.</p>
          ) : (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {list.map((p) => {
                const isSel = selected.includes(p.id);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => (multiple ? setSelected((s) => (isSel ? s.filter((x) => x !== p.id) : [...s, p.id])) : onPick([p.id]))}
                      className={`relative block aspect-square w-full overflow-hidden rounded-lg ring-offset-2 ${isSel ? "ring-2 ring-stone-900" : "hover:opacity-80"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={storageUrl(p.thumb_path)} alt={p.caption} className="h-full w-full object-cover" loading="lazy" />
                      {isSel && <span className="absolute right-1 top-1 rounded-full bg-stone-900 px-1.5 text-xs text-white">✓</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {multiple && (
          <div className="border-t border-stone-200 p-4">
            <button type="button" className="admin-btn w-full" onClick={() => onPick(selected)} disabled={selected.length === 0}>
              Adicionar {selected.length || ""} foto(s)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function PhotoField({ label, value, onChange, photos, album }: { label: string; value: string | null; onChange: (id: string | null) => void; photos: Photo[]; album: Album }) {
  const [open, setOpen] = useState(false);
  const photo = value ? photos.find((p) => p.id === value) : undefined;
  return (
    <div>
      <p className="admin-label">{label}</p>
      <div className="flex items-center gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-stone-100">
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={storageUrl(photo.thumb_path)} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setOpen(true)}>
          {photo ? "Trocar" : "Escolher foto"}
        </button>
        {photo && (
          <button type="button" className="text-sm text-red-600" onClick={() => onChange(null)}>
            Remover
          </button>
        )}
      </div>
      {open && (
        <PhotoPicker
          photos={photos}
          album={album}
          onClose={() => setOpen(false)}
          onPick={(ids) => {
            onChange(ids[0] ?? null);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

export function PhotoListField({ label, value, onChange, photos, album }: { label: string; value: string[]; onChange: (ids: string[]) => void; photos: Photo[]; album: Album }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <p className="admin-label">{label}</p>
      <div className="flex flex-wrap gap-2">
        {value.map((id) => {
          const p = photos.find((x) => x.id === id);
          return (
            <div key={id} className="relative h-16 w-16 overflow-hidden rounded-lg bg-stone-100">
              {p && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={storageUrl(p.thumb_path)} alt="" className="h-full w-full object-cover" />
              )}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== id))} className="absolute right-0.5 top-0.5 rounded-full bg-white/90 px-1.5 text-xs text-red-600" aria-label="Remover foto">
                ×
              </button>
            </div>
          );
        })}
        <button type="button" className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-stone-300 text-2xl text-stone-400 hover:border-stone-500" onClick={() => setOpen(true)} aria-label="Adicionar fotos">
          +
        </button>
      </div>
      {open && (
        <PhotoPicker
          multiple
          photos={photos}
          album={album}
          onClose={() => setOpen(false)}
          onPick={(ids) => {
            onChange(Array.from(new Set([...value, ...ids])).slice(0, 30));
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}
