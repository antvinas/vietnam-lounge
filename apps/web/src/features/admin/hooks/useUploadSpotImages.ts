import { useCallback } from "react";
import toast from "react-hot-toast";

import { uploadSpotImages } from "@/features/admin/api/admin.api";

type Options = {
  loadingText?: string;
  successText?: (count: number) => string;
  errorText?: string;
};

type Result =
  | { ok: true; urls: string[] }
  | { ok: false; error: unknown };

const DEFAULTS: Required<Options> = {
  loadingText: "이미지 업로드 중...",
  successText: (count) => (count > 0 ? "이미지 추가 완료" : "업로드할 이미지가 없습니다."),
  errorText: "이미지 업로드 실패",
};

/**
 * ✅ 업로드 + toast + 에러처리를 한 곳으로 통일
 * - API(uploadSpotImages)는 순수 업로더(Toast 없음)
 * - 화면은 이 훅만 사용해서 UX 정책 통일
 */
export function useUploadSpotImages(options: Options = {}) {
  const opts = { ...DEFAULTS, ...options };

  const uploadWithToast = useCallback(
    async (files: File[]): Promise<Result> => {
      const list = Array.isArray(files) ? files : [];
      if (list.length === 0) return { ok: true, urls: [] };

      const toastId = toast.loading(opts.loadingText);
      try {
        const urls = await uploadSpotImages(list);
        toast.success(opts.successText(urls.length), { id: toastId });
        return { ok: true, urls };
      } catch (err) {
        console.error(err);
        toast.error(opts.errorText, { id: toastId });
        return { ok: false, error: err };
      }
    },
    [opts.loadingText, opts.successText, opts.errorText]
  );

  return {
    uploadSpotImagesWithToast: uploadWithToast,
  };
}
