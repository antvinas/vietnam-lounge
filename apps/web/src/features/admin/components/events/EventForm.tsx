// apps/web/src/features/admin/components/events/EventForm.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import StickyActionsBar from "@/components/common/StickyActionsBar";
import Image from "@/components/common/Image";
import ImageSorter from "@/components/common/ImageSorter";

import { auth, storage } from "@/lib/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import type { AdminEventData } from "@/features/admin/api/admin.api";
import { EVENT_CATEGORIES, EVENT_CITIES } from "@/features/event/constants/eventTaxonomy";

type SaveIntent = "save" | "saveAndList" | "saveAndContinue";

type ImageItem = {
  url: string; // remote url OR objectURL(local)
  file?: File; // present when local
};

type Props = {
  title: string;
  isCreate: boolean;
  eventId?: string;
  lockMode?: boolean;
  defaultValues: Partial<AdminEventData>;
  onCancel: () => void;
  onSave: (payload: AdminEventData, intent: SaveIntent) => Promise<{ id?: string } | void>;
};

function ymdToDateValue(ymd?: string) {
  if (!ymd) return "";
  return ymd;
}

function toDatetimeLocalValue(v: any): string {
  if (!v) return "";
  try {
    const d =
      typeof v?.toDate === "function"
        ? v.toDate()
        : v instanceof Date
          ? v
          : new Date(String(v));
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
      d.getMinutes()
    )}`;
  } catch {
    return "";
  }
}

function statusLabel(st?: any) {
  const s = String(st || "").trim();
  if (s === "active") return "발행됨(공개)";
  if (s === "scheduled") return "발행 예약";
  if (s === "ended") return "종료됨(공개)";
  return "임시저장(비공개)";
}

function isPublicByStatus(st?: any) {
  const s = String(st || "").trim();
  return s === "active" || s === "ended";
}

function flattenRHFErrors(errors: any) {
  const out: string[] = [];
  const walk = (obj: any, path: string[] = []) => {
    if (!obj) return;
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      if (!v) continue;
      if (v?.message) out.push(`${path.concat(k).join(".")}: ${String(v.message)}`);
      else if (typeof v === "object") walk(v, path.concat(k));
    }
  };
  walk(errors);
  return out;
}

function isValidHttpUrl(u: string) {
  const s = String(u || "").trim();
  return s.startsWith("http://") || s.startsWith("https://");
}

/** ✅ UI 부작용 없는 이벤트 이미지 업로더 (Event 전용 path) */
async function uploadEventImages(files: File[]): Promise<string[]> {
  if (!files?.length) return [];
  const u = auth.currentUser;
  const uid = u?.uid || "anonymous";

  const uploaded: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const safeName = f.name.replaceAll(/[^a-zA-Z0-9._-]/g, "_");
    const path = `admin_uploads/events/${uid}/${Date.now()}_${i}_${safeName}`;
    const r = ref(storage, path);
    await uploadBytes(r, f);
    uploaded.push(await getDownloadURL(r));
  }
  return uploaded;
}

// ------------------------------
// Local UI primitives (no shadcn)
// ------------------------------
const inputBase =
  "h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 " +
  "outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 " +
  "disabled:bg-gray-100 disabled:text-gray-500";

const textareaBase =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 " +
  "outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 " +
  "disabled:bg-gray-100 disabled:text-gray-500";

function Btn({
  children,
  onClick,
  disabled,
  variant = "secondary",
  type = "button",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "outline" | "danger";
  className?: string;
}) {
  const cls =
    variant === "primary"
      ? "bg-slate-900 text-white hover:bg-black"
      : variant === "outline"
        ? "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
        : variant === "danger"
          ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
          : "bg-gray-100 text-gray-900 hover:bg-gray-200";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-extrabold transition whitespace-nowrap",
        cls,
        disabled ? "opacity-60 cursor-not-allowed" : "",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Card({
  title,
  children,
  desc,
}: {
  title: string;
  desc?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-base font-black text-gray-900">{title}</div>
            {desc ? <div className="mt-1 text-sm text-gray-600">{desc}</div> : null}
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function EventForm({
  title,
  isCreate,
  eventId,
  lockMode,
  defaultValues,
  onCancel,
  onSave,
}: Props) {
  // ------------------------------
  // Image state (cover + gallery)
  // ------------------------------
  const initImages = useMemo<ImageItem[]>(() => {
    const cover = String(defaultValues.imageUrl || "").trim();
    const g = Array.isArray(defaultValues.gallery)
      ? defaultValues.gallery.map((x) => String(x)).filter(Boolean)
      : [];
    const uniq: string[] = [];
    const push = (u: string) => {
      const s = String(u || "").trim();
      if (!s) return;
      if (uniq.includes(s)) return;
      uniq.push(s);
    };
    if (cover) push(cover);
    g.forEach(push);
    return uniq.map((u) => ({ url: u }));
  }, [defaultValues.gallery, defaultValues.imageUrl]);

  const [images, setImages] = useState<ImageItem[]>(initImages);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [saving, setSaving] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [showAdvancedUrl, setShowAdvancedUrl] = useState(false);

  const revokeBlob = (it?: ImageItem) => {
    if (!it?.file) return;
    if (it.url?.startsWith("blob:")) URL.revokeObjectURL(it.url);
  };

  // objectURL revoke on unmount
  useEffect(() => {
    return () => {
      for (const it of images) revokeBlob(it);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------
  // Publish defaults
  // ------------------------------
  const rawStatus = (defaultValues as any)?.status;
  const derivedStatus =
    rawStatus ??
    ((defaultValues.visibility === "public" || defaultValues.isPublic !== false) ? "active" : "draft");

  const defaultPublishAt = toDatetimeLocalValue((defaultValues as any)?.publishAt);

  // 상태 기준으로 공개/비공개 기본값을 일관되게 맞춤
  const coercedPublic = isPublicByStatus(derivedStatus);
  const coercedVisibility = coercedPublic ? "public" : "private";
  const coercedIsPublic = coercedPublic;

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors, isDirty },
  } = useForm<AdminEventData>({
    defaultValues: {
      ...(defaultValues as any),

      mode: (defaultValues.mode as any) ?? "explorer",

      // ✅ Step3: 발행 UX의 근간 필드
      status: derivedStatus as any,
      publishAt: defaultPublishAt as any,

      visibility: coercedVisibility as any,
      isPublic: coercedIsPublic as any,

      title: (defaultValues.title ?? (defaultValues as any).name ?? "") as any,
      description: defaultValues.description ?? "",
      location: defaultValues.location ?? "",
      organizer: defaultValues.organizer ?? "",
      city: defaultValues.city ?? "",
      category: defaultValues.category ?? "",
      date: defaultValues.date ?? "",
      endDate: defaultValues.endDate ?? "",

      imageUrl: defaultValues.imageUrl ?? "",
      gallery: Array.isArray(defaultValues.gallery) ? defaultValues.gallery : [],
    } as any,
    mode: "onSubmit",
  });

  const mode = watch("mode");
  const date = watch("date");
  const endDate = watch("endDate");

  const status = watch("status" as any);
  const publishAt = watch("publishAt" as any);
  const visibility = watch("visibility");
  const isPublic = watch("isPublic");

  const coverUrl = images[0]?.url ?? "";

  const previewUrl = useMemo(() => {
    if (!eventId) return "";
    return mode === "nightlife" ? `/adult/events/${eventId}` : `/events/${eventId}`;
  }, [eventId, mode]);

  // ✅ status ↔ 공개/비공개를 강하게 동기화 (운영 사고 방지)
  useEffect(() => {
    const pub = isPublicByStatus(status);
    const v = pub ? "public" : "private";

    if (getValues("visibility") !== v) setValue("visibility", v as any, { shouldDirty: true });
    if (getValues("isPublic") !== pub) setValue("isPublic", pub as any, { shouldDirty: true });

    // scheduled가 아닌데 publishAt이 남아있으면 지움(혼선 방지)
    const s = String(status || "").trim();
    if (s !== "scheduled") {
      if (String(getValues("publishAt" as any) || "").trim()) {
        setValue("publishAt" as any, "" as any, { shouldDirty: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // 날짜 가드레일
  useEffect(() => {
    if (!date || !endDate) return;
    if (endDate < date) {
      toast.error("종료일이 시작일보다 빠릅니다. 종료일을 시작일로 자동 보정했어요.");
      setValue("endDate", date as any, { shouldDirty: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, endDate]);

  // ------------------------------
  // Image handlers
  // ------------------------------
  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    const next: ImageItem[] = list.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
    }));
    setImages((prev) => [...prev, ...next]);
  };

  const onPickFiles = () => fileInputRef.current?.click();

  const setAsCover = (idx: number) => {
    setImages((prev) => {
      if (idx <= 0 || idx >= prev.length) return prev;
      const copy = [...prev];
      const [it] = copy.splice(idx, 1);
      copy.unshift(it);
      return copy;
    });
  };

  const removeImage = (idx: number) => {
    setImages((prev) => {
      const copy = [...prev];
      const [it] = copy.splice(idx, 1);
      revokeBlob(it);
      return copy;
    });
  };

  const removeAllImages = () => {
    setImages((prev) => {
      prev.forEach(revokeBlob);
      return [];
    });
  };

  const addUrl = (where: "cover" | "gallery") => {
    const u = String(newUrl || "").trim();
    if (!u) return toast.error("URL을 입력해 주세요.");
    if (!isValidHttpUrl(u)) return toast.error("http(s)로 시작하는 URL만 허용됩니다.");

    // 운영 리스크 안내(엑박)
    if (!showAdvancedUrl) {
      return toast.error("URL 직접 추가는 ‘고급 옵션’에서만 허용됩니다.");
    }

    setNewUrl("");
    setImages((prev) => {
      if (prev.some((x) => x.url === u)) return prev;
      if (where === "cover") return [{ url: u }, ...prev];
      return [...prev, { url: u }];
    });
  };

  const buildPayloadWithImages = async (base: AdminEventData) => {
    const filesToUpload = images.filter((x) => x.file).map((x) => x.file!) as File[];

    let uploaded: string[] = [];
    if (filesToUpload.length) {
      uploaded = await uploadEventImages(filesToUpload);
    }

    let uploadIdx = 0;
    const finalUrls = images.map((it) => {
      if (!it.file) return it.url;
      const u = uploaded[uploadIdx++];
      return u ?? it.url;
    });

    // blob -> remote url 치환 후 상태 반영
    setImages(finalUrls.map((u) => ({ url: u })));

    const payload: AdminEventData = {
      ...base,
      imageUrl: finalUrls[0] ?? "",
      gallery: finalUrls.length ? finalUrls : [],
    } as any;

    return payload;
  };

  const submit = (intent: SaveIntent) =>
    handleSubmit(
      async (data) => {
        setSaving(true);

        const tId = toast.loading(isCreate ? "이벤트 저장 중..." : "이벤트 수정 중...");
        try {
          const stRaw = String((data as any).status || "").trim();
          const st =
            stRaw === "draft" || stRaw === "scheduled" || stRaw === "active" || stRaw === "ended"
              ? stRaw
              : isPublicByStatus(data.visibility) || data.isPublic
                ? "active"
                : "draft";

          // 예약 발행 검증
          const pAt = String((data as any).publishAt || "").trim();
          if (st === "scheduled") {
            if (!pAt) throw new Error("발행 예약 시간을 입력해 주세요.");
            const d = new Date(pAt);
            if (Number.isNaN(d.getTime())) throw new Error("발행 예약 시간이 올바르지 않습니다.");
            if (d.getTime() <= Date.now()) throw new Error("발행 예약 시간은 ‘현재 시간 이후’여야 합니다.");
          }

          const pub = st === "active" || st === "ended";
          const v = pub ? "public" : "private";

          const payload = await buildPayloadWithImages({
            ...data,
            status: st as any,
            // scheduled만 publishAt 유지
            publishAt: st === "scheduled" ? pAt : "",
            visibility: v as any,
            isPublic: pub as any,
            endDate: data.endDate && data.endDate !== data.date ? data.endDate : "",
          } as any);

          await onSave(payload, intent);
          toast.success(isCreate ? "이벤트가 저장되었습니다." : "이벤트가 수정되었습니다.");
        } catch (e: any) {
          console.error(e);
          toast.error(e?.message ? String(e.message) : "저장 중 오류가 발생했습니다.");
        } finally {
          toast.dismiss(tId);
          setSaving(false);
        }
      },
      () => {
        const list = flattenRHFErrors(errors);
        toast.error(list.length ? list[0] : "필수 입력을 확인해 주세요.");
      }
    )();

  const publishNow = () => {
    setValue("status" as any, "active" as any, { shouldDirty: true });
    setValue("publishAt" as any, "" as any, { shouldDirty: true });
    submit("saveAndContinue");
  };

  const saveDraft = () => {
    setValue("status" as any, "draft" as any, { shouldDirty: true });
    setValue("publishAt" as any, "" as any, { shouldDirty: true });
    submit("saveAndContinue");
  };

  const schedulePublish = () => {
    setValue("status" as any, "scheduled" as any, { shouldDirty: true });
    submit("saveAndContinue");
  };

  const openPreview = () => {
    if (!previewUrl) return toast.error("먼저 저장한 뒤 미리보기를 사용할 수 있어요.");
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  };

  const checks = useMemo(() => {
    const titleOk = !!String(watch("title") || "").trim();
    const dateOk = !!String(watch("date") || "").trim();
    const coverOk = !!String(coverUrl || "").trim();
    const st = String(status || "").trim();
    const stOk =
      st === "draft" ||
      st === "active" ||
      st === "ended" ||
      (st === "scheduled" && !!String(publishAt || "").trim());

    return [
      { label: "이벤트명", ok: titleOk },
      { label: "시작일", ok: dateOk },
      { label: "대표 이미지", ok: coverOk },
      { label: "발행 상태(예약 포함)", ok: stOk },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coverUrl, status, publishAt, watch("title"), watch("date")]);

  const actions = useMemo(() => {
    return [
      { key: "cancel", label: "취소", tone: "secondary", onClick: onCancel },
      {
        key: "preview",
        label: "미리보기",
        tone: "secondary",
        onClick: openPreview,
        disabled: !eventId,
      },
      { key: "save", label: "저장", tone: "primary", onClick: () => submit("save"), disabled: saving },
      {
        key: "saveAndList",
        label: "저장 후 목록",
        tone: "secondary",
        onClick: () => submit("saveAndList"),
        disabled: saving,
      },
      {
        key: "saveAndContinue",
        label: "저장 후 계속",
        tone: "secondary",
        onClick: () => submit("saveAndContinue"),
        disabled: saving,
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saving, eventId, previewUrl]);

  return (
    <div className="space-y-4">
      <StickyActionsBar title={title} actions={actions as any} dirty={isDirty} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* LEFT: form */}
        <div className="lg:col-span-8 space-y-4">
          <Card title="기본 정보" desc="필수 입력을 먼저 채우고, 나머지는 단계적으로 보완하세요.">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm font-extrabold text-gray-900 mb-2">모드</div>
                <select
                  className={inputBase}
                  disabled={lockMode}
                  {...register("mode" as any, { required: true })}
                >
                  <option value="explorer">Explorer</option>
                  <option value="nightlife">Nightlife</option>
                </select>
              </div>

              {/* ✅ Step3: 영어 public 제거 + 상태 요약만 표시 */}
              <div>
                <div className="text-sm font-extrabold text-gray-900 mb-2">발행 상태</div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-800">
                    {statusLabel(status)}
                  </span>
                  <span className="text-xs text-gray-500">우측 ‘발행’ 패널에서 변경</span>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4">
              <div>
                <div className="text-sm font-extrabold text-gray-900 mb-2">이벤트명</div>
                <input
                  className={inputBase}
                  placeholder="예) 하노이 불꽃축제 2026"
                  {...register("title" as any, { required: "이벤트명은 필수입니다." })}
                />
                {errors?.title ? <div className="mt-1 text-xs text-red-600">{String((errors as any).title?.message)}</div> : null}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm font-extrabold text-gray-900 mb-2">시작일</div>
                  <input
                    type="date"
                    className={inputBase}
                    value={ymdToDateValue(date)}
                    onChange={(e) => setValue("date" as any, e.target.value as any, { shouldDirty: true })}
                  />
                </div>

                <div>
                  <div className="text-sm font-extrabold text-gray-900 mb-2">종료일(선택)</div>
                  <input
                    type="date"
                    className={inputBase}
                    value={ymdToDateValue(endDate)}
                    onChange={(e) => setValue("endDate" as any, e.target.value as any, { shouldDirty: true })}
                  />
                  <div className="mt-1 text-xs text-gray-500">종료일이 없으면 시작일만 노출됩니다.</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm font-extrabold text-gray-900 mb-2">도시</div>
                  <select className={inputBase} {...register("city" as any)}>
                    <option value="">선택</option>
                    {EVENT_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="text-sm font-extrabold text-gray-900 mb-2">카테고리</div>
                  <select className={inputBase} {...register("category" as any)}>
                    <option value="">선택</option>
                    {EVENT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm font-extrabold text-gray-900 mb-2">장소</div>
                  <input className={inputBase} placeholder="예) Tay Ho, Hanoi" {...register("location" as any)} />
                </div>

                <div>
                  <div className="text-sm font-extrabold text-gray-900 mb-2">주최/주관(선택)</div>
                  <input className={inputBase} placeholder="예) Hanoi City" {...register("organizer" as any)} />
                </div>
              </div>

              <div>
                <div className="text-sm font-extrabold text-gray-900 mb-2">설명</div>
                <textarea
                  className={textareaBase}
                  rows={6}
                  placeholder="이벤트 소개/시간/참여 방법/주의사항 등을 적어주세요."
                  {...register("description" as any)}
                />
              </div>
            </div>
          </Card>

          {/* ✅ Step2 + Step3: 이미지 섹션(업로드 우선 + URL은 고급 옵션) */}
          <Card
            title="이미지"
            desc={
              <div className="space-y-1">
                <div className="text-sm text-gray-700">
                  <b>대표 이미지</b>를 지정하고, 아래에 갤러리를 관리하세요.
                </div>
                <div className="text-xs text-gray-500">
                  권장: 대표 1장 + 갤러리 3~8장. 업로드를 우선 사용하세요(URL은 엑박 리스크).
                </div>
              </div>
            }
          >
            {/* hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />

            <div className="flex flex-wrap items-center gap-2">
              <Btn variant="primary" onClick={onPickFiles}>
                업로드
              </Btn>
              <Btn variant="outline" onClick={() => removeAllImages()} disabled={!images.length}>
                전체 삭제
              </Btn>

              <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
                <span className="rounded-full bg-gray-100 px-2 py-1">
                  대표: {images.length ? "1" : "0"}
                </span>
                <span className="rounded-full bg-gray-100 px-2 py-1">
                  총 {images.length}장
                </span>
              </div>
            </div>

            {/* Cover */}
            <div className="mt-4">
              <div className="text-sm font-extrabold text-gray-900 mb-2">대표 이미지</div>
              {images.length ? (
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <div className="aspect-[16/9] bg-gray-50">
                    <Image src={images[0].url} alt="cover" className="h-full w-full object-cover" />
                  </div>
                  <div className="p-3 flex items-center justify-between gap-2">
                    <div className="text-xs text-gray-600 line-clamp-1">{images[0].url}</div>
                    <Btn variant="danger" onClick={() => removeImage(0)}>
                      삭제
                    </Btn>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500">
                  아직 대표 이미지가 없어요. <b>업로드</b>로 추가해 주세요.
                </div>
              )}
            </div>

            {/* Gallery */}
            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-extrabold text-gray-900">갤러리</div>
                <div className="text-xs text-gray-500">드래그로 순서 변경 / 대표 지정 / 삭제</div>
              </div>

              <div className="mt-3">
                <ImageSorter
                  items={images.map((x) => x.url)}
                  onChange={(next: string[]) => {
                    setImages((prev) => {
                      // preserve File references where possible
                      const map = new Map(prev.map((it) => [it.url, it]));
                      const rebuilt: ImageItem[] = next.map((u) => map.get(u) ?? { url: u });
                      return rebuilt;
                    });
                  }}
                  renderItem={(url: string, idx: number) => {
                    const isCover = idx === 0;
                    return (
                      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
                        <div className="aspect-[4/3] bg-gray-50">
                          <Image src={url} alt={`img-${idx}`} className="h-full w-full object-cover" />
                        </div>
                        <div className="p-2 flex items-center justify-between gap-2">
                          <div className="text-[11px] text-gray-600 line-clamp-1">{url}</div>
                          <div className="flex items-center gap-2">
                            {!isCover ? (
                              <button
                                type="button"
                                onClick={() => setAsCover(idx)}
                                className="text-[11px] font-extrabold text-slate-700 hover:underline"
                              >
                                대표로
                              </button>
                            ) : (
                              <span className="text-[11px] font-black text-slate-900">대표</span>
                            )}
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="text-[11px] font-extrabold text-red-700 hover:underline"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
              </div>

              {/* Advanced URL add */}
              <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-extrabold text-gray-900">고급 옵션: URL 추가</div>
                    <div className="mt-1 text-xs text-gray-500">
                      URL은 원본이 삭제되면 <b>엑박</b>이 뜰 수 있어요. 가능하면 업로드를 권장합니다.
                    </div>
                  </div>
                  <Btn
                    variant="outline"
                    onClick={() => setShowAdvancedUrl((v) => !v)}
                  >
                    {showAdvancedUrl ? "접기" : "열기"}
                  </Btn>
                </div>

                {showAdvancedUrl ? (
                  <div className="mt-3 space-y-3">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                      <input
                        className={inputBase}
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        placeholder="https://..."
                      />
                      <div className="flex items-center gap-2">
                        <Btn variant="outline" onClick={() => addUrl("cover")}>
                          URL 추가(대표)
                        </Btn>
                        <Btn variant="outline" onClick={() => addUrl("gallery")}>
                          URL 추가(갤러리)
                        </Btn>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      운영 팁: 외부 URL을 쓸 경우, 원본 소스가 안정적인 CDN인지 꼭 확인하세요.
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT: publish + preview + checks */}
        <div className="lg:col-span-4 space-y-4">
          {/* ✅ Step3: 미리보기 → 발행(즉시/예약) 분리 */}
          <Card
            title="발행"
            desc="미리보기로 최종 확인 후, ‘즉시 발행’ 또는 ‘예약 발행’을 선택하세요."
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-gray-500">현재 상태</div>
                  <div className="mt-1 inline-flex items-center gap-2">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-800">
                      {statusLabel(status)}
                    </span>
                    {String(status || "").trim() === "scheduled" && String(publishAt || "").trim() ? (
                      <span className="text-xs text-gray-600">
                        {String(publishAt)}
                      </span>
                    ) : null}
                  </div>
                </div>

                <Btn variant="outline" onClick={openPreview} disabled={!eventId}>
                  미리보기
                </Btn>
              </div>

              {/* immediate publish / draft */}
              <div className="grid grid-cols-1 gap-2">
                {isPublic ? (
                  <Btn variant="danger" onClick={saveDraft} disabled={saving}>
                    비공개로 전환(임시저장)
                  </Btn>
                ) : (
                  <Btn variant="secondary" onClick={saveDraft} disabled={saving}>
                    임시저장(비공개)
                  </Btn>
                )}

                <Btn variant="primary" onClick={publishNow} disabled={saving}>
                  즉시 발행(공개)
                </Btn>
              </div>

              {/* scheduled publish */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                <div className="text-sm font-extrabold text-gray-900">예약 발행</div>
                <div className="text-xs text-gray-600">
                  예약 시간까지는 비공개 상태로 유지됩니다. (운영자가 일정에 맞춰 발행 관리)
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">발행 예약 시간</div>
                  <input
                    type="datetime-local"
                    className={inputBase}
                    value={String(publishAt || "")}
                    onChange={(e) => setValue("publishAt" as any, e.target.value as any, { shouldDirty: true })}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Btn variant="outline" onClick={schedulePublish} disabled={saving}>
                    발행 예약 저장
                  </Btn>
                  {String(status || "").trim() === "scheduled" ? (
                    <Btn variant="danger" onClick={saveDraft} disabled={saving}>
                      예약 해제
                    </Btn>
                  ) : null}
                </div>

                <div className="text-xs text-gray-500">
                  * 자동 발행(예약 시간에 공개 전환)은 서버 크론/트리거로 확장 가능합니다.
                </div>
              </div>
            </div>
          </Card>

          <Card title="미리보기">
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="text-xs text-gray-500">대표 이미지</div>
                {coverUrl ? (
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <div className="aspect-[16/9] bg-gray-50">
                      <Image src={coverUrl} alt="preview-cover" className="h-full w-full object-cover" />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500">
                    (대표 이미지 없음)
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="text-xs text-gray-500">제목</div>
                <div className="text-base font-black text-gray-900">{watch("title") || "(제목 없음)"}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">기간</div>
                  <div className="text-gray-800">
                    {watch("date") || "-"}
                    {watch("endDate") && watch("endDate") !== watch("date") ? ` ~ ${watch("endDate")}` : ""}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">도시</div>
                  <div className="text-gray-800">{watch("city") || "-"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">카테고리</div>
                  <div className="text-gray-800">{watch("category") || "-"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">공개</div>
                  <div className="text-gray-800">{visibility === "public" ? "공개" : "비공개"}</div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-gray-500">요약</div>
                <div className="line-clamp-5 whitespace-pre-wrap text-sm text-gray-600">
                  {watch("description") || "(설명 없음)"}
                </div>
              </div>
            </div>
          </Card>

          <Card title="운영 체크">
            <div className="space-y-2 text-sm text-gray-700">
              {checks.map((c) => (
                <div key={c.label} className="flex items-center justify-between gap-3">
                  <div className="font-medium">{c.label}</div>
                  <div className={c.ok ? "text-emerald-700 font-extrabold" : "text-amber-700 font-extrabold"}>
                    {c.ok ? "✅ OK" : "⚠️ 확인"}
                  </div>
                </div>
              ))}

              <div className="pt-2 text-xs text-gray-500">
                운영 팁: <b>미리보기</b>로 최종 확인 → <b>임시저장(비공개)</b> → 검수 완료 후 <b>즉시 발행(공개)</b> 흐름이 사고를 가장 줄입니다.
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="h-10" />
    </div>
  );
}
