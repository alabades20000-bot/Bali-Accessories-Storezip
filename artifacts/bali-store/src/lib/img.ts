/** Fast image URLs: use Supabase image transforms when possible (auto WebP/AVIF). */
export function fastImage(url: string | null | undefined, width = 600, quality = 65) {
  if (!url) return url ?? null;
  if (!url.includes("/storage/v1/object/public/")) return url;
  const base = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
  const sep = base.includes("?") ? "&" : "?";
  // No `format` param → Supabase negotiates WebP/AVIF from the Accept header.
  return `${base}${sep}width=${width}&quality=${quality}&resize=cover`;
}

/** Is this a transformable (Supabase storage) URL? */
export function isTransformable(url: string | null | undefined) {
  return Boolean(url && url.includes("/storage/v1/object/public/"));
}

/** Tiny blurred preview that loads almost instantly on weak connections. */
export function tinyImage(url: string | null | undefined, width = 24) {
  if (!isTransformable(url)) return null;
  return fastImage(url, width, 20) as string;
}

/** Responsive srcset so phones download small files. */
export function imageSrcSet(url: string | null | undefined, widths: number[], quality = 60) {
  if (!isTransformable(url)) return undefined;
  return widths.map((w) => `${fastImage(url, w, quality)} ${w}w`).join(", ");
}
