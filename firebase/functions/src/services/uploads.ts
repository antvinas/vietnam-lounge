const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_MB = 8;

export function validateReviewPhotoList(files: Array<{ url: string; type?: string; size?: number }>) {
  const ok = [];
  for (const f of files) {
    if (f.type && !ALLOWED.includes(f.type)) continue;
    if (typeof f.size === "number" && f.size > MAX_MB * 1024 * 1024) continue;
    if (typeof f.url === "string" && f.url.startsWith("http")) ok.push(f.url);
  }
  return ok.slice(0, 8);
}
