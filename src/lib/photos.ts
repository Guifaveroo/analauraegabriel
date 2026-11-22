import { PHOTOS_BUCKET, SUPABASE_URL } from "./env";
import type { Photo } from "./types";

export function storageUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${PHOTOS_BUCKET}/${path}`;
}

export function photoSources(photo: Photo) {
  return {
    src: storageUrl(photo.storage_path),
    thumb: storageUrl(photo.thumb_path),
    srcSet: `${storageUrl(photo.thumb_path)} 640w, ${storageUrl(photo.storage_path)} ${photo.width}w`,
  };
}
