/**
 * Otimização de imagens no navegador antes do envio:
 * - aceita apenas JPEG, PNG e WebP (validado pelo tipo e pela decodificação real);
 * - corrige a orientação (EXIF) e remove metadados (inclusive localização GPS);
 * - gera duas versões WebP: grande (até 2000px) e miniatura (até 640px).
 * Assim o site carrega rápido e respeita os limites do plano gratuito.
 */

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_INPUT_BYTES = 25 * 1024 * 1024;
export const MAX_OUTPUT_BYTES = 5 * 1024 * 1024;

export type CompressedImage = { full: Blob; thumb: Blob; width: number; height: number };

async function toWebp(bitmap: ImageBitmap, maxSide: number, quality: number) {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Seu navegador não conseguiu processar a imagem.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
  if (!blob || blob.type !== "image/webp") throw new Error("Não foi possível converter a imagem para WebP.");
  return { blob, w, h };
}

export async function compressImage(file: File): Promise<CompressedImage> {
  if (!ACCEPTED_TYPES.includes(file.type)) throw new Error(`${file.name}: formato não aceito (use JPG, PNG ou WebP).`);
  if (file.size > MAX_INPUT_BYTES) throw new Error(`${file.name}: arquivo muito grande (máx. 25 MB).`);

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(`${file.name}: o arquivo não é uma imagem válida.`);
  }

  try {
    let full = await toWebp(bitmap, 2000, 0.82);
    if (full.blob.size > MAX_OUTPUT_BYTES) full = await toWebp(bitmap, 1600, 0.72);
    const thumb = await toWebp(bitmap, 640, 0.78);
    return { full: full.blob, thumb: thumb.blob, width: full.w, height: full.h };
  } finally {
    bitmap.close();
  }
}
