// apps/web/src/utils/share.ts
// Web Share 지원 시 navigator.share, 미지원 시 clipboard.writeText 폴백
export async function shareOrCopy(data: { title?: string; text?: string; url?: string }) {
  try {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      // @ts-ignore
      await navigator.share(data);
      return true; // shared
    }
  } catch {
    // fall through to copy
  }
  try {
    await navigator.clipboard.writeText(data.url || window.location.href);
    return false; // copied
  } catch {
    return false;
  }
}
