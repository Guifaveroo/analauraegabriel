import { requireAdmin } from "@/lib/auth";
import { PageHeader, EmptyState, FilterTabs } from "@/components/admin/ui";
import { PhotoUploader } from "@/components/admin/PhotoUploader";
import { ALBUMS, ALBUM_LABELS, type Album } from "@/lib/admin/albums";
import type { Photo } from "@/lib/types";
import { PhotoCard } from "./PhotoCard";

export default async function PhotosPage({ searchParams }: { searchParams: Promise<{ album?: string }> }) {
  const { supabase } = await requireAdmin();
  const { album: albumParam } = await searchParams;
  const album = ALBUMS.includes(albumParam as Album) ? (albumParam as Album) : "";
  const { data } = await supabase.from("photos").select("*").order("album").order("position").order("created_at");
  const all = (data ?? []) as Photo[];
  const photos = album ? all.filter((p) => p.album === album) : all;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Fotografias"
        description="Biblioteca de imagens do site. Envie, organize por álbum, ordene e reutilize as fotos em qualquer seção."
      />
      <div className="mb-6">
        <PhotoUploader defaultAlbum={album || "gallery"} />
      </div>

      <FilterTabs
        base="/admin/fotos"
        param="album"
        current={album}
        options={[
          { value: "", label: "Todas", count: all.length },
          ...ALBUMS.map((a) => ({ value: a, label: ALBUM_LABELS[a], count: all.filter((p) => p.album === a).length })),
        ]}
      />

      {photos.length === 0 ? (
        <EmptyState>Nenhuma foto neste álbum ainda.</EmptyState>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p) => (
            <li key={p.id}>
              <PhotoCard photo={p} />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-xs text-stone-500">
        A ordem vale dentro de cada álbum. A foto marcada com ★ é a principal da galeria (aparece primeiro).
      </p>
    </div>
  );
}
