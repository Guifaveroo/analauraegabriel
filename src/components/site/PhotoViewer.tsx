"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Photo } from "@/lib/types";
import { photoSources } from "@/lib/photos";

type Props = {
  photos: Photo[];
  layout?: "grid" | "carousel" | "strip";
  emptyLabel?: string;
};

/** Grade/carrossel de fotos com visualização ampliada (teclado e gesto de deslizar). */
export function PhotoViewer({ photos, layout = "grid", emptyLabel }: Props) {
  const [index, setIndex] = useState<number | null>(null);
  const touchX = useRef<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setIndex(null), []);
  const go = useCallback(
    (delta: number) => setIndex((i) => (i === null ? i : (i + delta + photos.length) % photos.length)),
    [photos.length],
  );

  useEffect(() => {
    if (index === null) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [index, close, go]);

  if (photos.length === 0) {
    return emptyLabel ? <p className="muted text-center text-sm">{emptyLabel}</p> : null;
  }

  const thumb = (p: Photo, i: number, className: string, sizes: string) => {
    const s = photoSources(p);
    return (
      <button
        key={p.id}
        type="button"
        onClick={() => setIndex(i)}
        className={`group relative block overflow-hidden focus-visible:outline-2 focus-visible:outline-primary ${className}`}
        aria-label={`Ampliar foto${p.caption ? `: ${p.caption}` : ""}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={s.thumb}
          srcSet={s.srcSet}
          sizes={sizes}
          width={p.width}
          height={p.height}
          alt={p.caption || ""}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
        />
        {p.caption && (
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-left text-xs text-white opacity-0 transition group-hover:opacity-100">
            {p.caption}
          </span>
        )}
      </button>
    );
  };

  const scrollBy = (dir: number) => trackRef.current?.scrollBy({ left: dir * trackRef.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <>
      {layout === "grid" && (
        <div className="columns-2 gap-3 md:columns-3 md:gap-4 [&>*]:mb-3 md:[&>*]:mb-4">
          {photos.map((p, i) => thumb(p, i, "w-full break-inside-avoid", "(min-width: 768px) 33vw, 50vw"))}
        </div>
      )}

      {(layout === "carousel" || layout === "strip") && (
        <div className="relative">
          <div ref={trackRef} className="scrollbar-none -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 sm:mx-0 sm:px-0">
            {photos.map((p, i) =>
              thumb(
                p,
                i,
                `shrink-0 snap-center ${layout === "carousel" ? "aspect-[4/5] w-[78%] sm:w-[42%] lg:w-[32%]" : "aspect-square w-40 sm:w-52"}`,
                layout === "carousel" ? "(min-width: 1024px) 33vw, 80vw" : "208px",
              ),
            )}
          </div>
          {layout === "carousel" && photos.length > 2 && (
            <div className="mt-6 flex justify-center gap-3">
              <button type="button" onClick={() => scrollBy(-1)} className="btn btn-ghost !px-4" aria-label="Fotos anteriores">
                ←
              </button>
              <button type="button" onClick={() => scrollBy(1)} className="btn btn-ghost !px-4" aria-label="Próximas fotos">
                →
              </button>
            </div>
          )}
        </div>
      )}

      {index !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Visualização da foto"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-4"
          onClick={close}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoSources(photos[index]).src}
            alt={photos[index].caption || ""}
            className="max-h-[85vh] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {photos[index].caption && (
            <p className="absolute inset-x-0 bottom-6 px-6 text-center text-sm text-white/85">{photos[index].caption}</p>
          )}
          <button type="button" onClick={close} className="absolute right-3 top-3 flex h-12 w-12 items-center justify-center text-3xl text-white" aria-label="Fechar">
            ×
          </button>
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => (e.stopPropagation(), go(-1))}
                className="absolute left-2 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center text-3xl text-white sm:flex"
                aria-label="Foto anterior"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => (e.stopPropagation(), go(1))}
                className="absolute right-2 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center text-3xl text-white sm:flex"
                aria-label="Próxima foto"
              >
                ›
              </button>
              <p className="absolute left-4 top-5 text-xs tracking-widest text-white/70">
                {index + 1} / {photos.length}
              </p>
            </>
          )}
        </div>
      )}
    </>
  );
}
