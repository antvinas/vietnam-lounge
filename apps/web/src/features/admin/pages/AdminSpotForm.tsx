// apps/web/src/features/admin/pages/AdminSpotForm.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  FaSave,
  FaArrowLeft,
  FaCloudUploadAlt,
  FaMoon,
  FaSun,
  FaCrown,
  FaLock,
  FaBroom,
  FaTrashAlt,
  FaExternalLinkAlt,
  FaCopy,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

import { addSpot, getSpotById, updateSpot } from "@/features/admin/api/admin.api";
import { useUploadSpotImages } from "@/features/admin/hooks/useUploadSpotImages";

import {
  POPULAR_LOCATIONS,
  SPOT_CATEGORIES,
  normalizeSpotCategory,
  type SpotMode,
  PRICE_LEVEL_LABELS,
  PRICE_LEVEL_OPTIONS,
  BUDGET_UNITS,
  getDefaultBudgetUnit,
  type BudgetUnit,
  type PriceLevel,
} from "@/constants/filters";

import ImageSorter from "@/components/common/ImageSorter";
import Button from "@/components/common/Button";

import MapWrapper from "@/components/map/MapWrapper";
import GoogleMap from "@/components/map/GoogleMap";
import type { LatLng, Marker } from "@/components/map/types";

const today = new Date().toISOString().split("T")[0];

function addDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

const toNumberOrUndefined = (v: unknown) => {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return n;
};

const toNumber = (v: unknown, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const isPriceLevel = (n: unknown): n is PriceLevel => {
  const v = Number(n);
  return Number.isFinite(v) && [0, 1, 2, 3, 4].includes(Math.trunc(v));
};

const isBudgetUnit = (u: unknown): u is BudgetUnit => {
  const s = String(u ?? "").trim();
  if (!s) return false;
  return BUDGET_UNITS.some((x) => x.value === s);
};

const spotSchema = z
  .object({
    name: z.string().min(1, "이름을 입력해주세요"),
    locationId: z.string().min(1, "지역(City)을 선택/입력해주세요"),
    category: z.string().min(1, "카테고리를 선택해주세요"),
    mode: z.enum(["explorer", "nightlife"]),

    latitude: z.preprocess((v) => toNumber(v, 10.762622), z.number()),
    longitude: z.preprocess((v) => toNumber(v, 106.660172), z.number()),
    address: z.string().optional(),
    description: z.string().optional(),

    rating: z.preprocess((v) => toNumber(v, 4.5), z.number()),
    // ✅ 0~4 등급(필터 전용)
    priceLevel: z.preprocess((v) => toNumber(v, 1), z.number().int().min(0).max(4)),

    openHours: z.string().optional(),

    // ✅ 표시용 예산(선택 입력)
    budget: z.preprocess((v) => toNumberOrUndefined(v), z.number().min(0).optional()),
    budgetUnit: z.string().optional(),
    budgetText: z.string().optional(),

    images: z.array(
      z.object({
        url: z.string(),
        caption: z.string().optional(),
      })
    ),

    isSponsored: z.boolean(),
    sponsorLevel: z.string().optional(),
    sponsorExpiry: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    // 광고
    if (val.isSponsored) {
      if (!val.sponsorLevel) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sponsorLevel"],
          message: "광고 등급을 선택해주세요",
        });
      }
      if (!val.sponsorExpiry) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sponsorExpiry"],
          message: "광고 만료일을 입력해주세요",
        });
      }
      if (val.sponsorExpiry && val.sponsorExpiry < today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sponsorExpiry"],
          message: "만료일은 오늘 이후여야 합니다",
        });
      }
    }

    // ✅ budget/budgetUnit 정합성
    if (val.budget !== undefined) {
      if (!val.budgetUnit || !isBudgetUnit(val.budgetUnit)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["budgetUnit"],
          message: "예산 단위를 선택해주세요",
        });
      }
    }
    if (val.budgetUnit && val.budget === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["budget"],
        message: "예산 금액을 입력해주세요",
      });
    }
    if (val.budgetUnit && !isBudgetUnit(val.budgetUnit)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["budgetUnit"],
        message: "올바르지 않은 예산 단위입니다",
      });
    }

    // priceLevel 범위 재확인(운영 안전벨트)
    if (!isPriceLevel(val.priceLevel)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["priceLevel"],
        message: "가격대(등급)는 0~4 중에서 선택해주세요",
      });
    }
  });

type SpotFormValues = z.input<typeof spotSchema>;

function isValidImageUrl(u: string) {
  const url = String(u || "").trim();
  if (!url) return false;
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("gs://");
}

function normalizeImages(items: Array<{ url: string; caption?: string }>) {
  const out: Array<{ url: string; caption?: string }> = [];
  const seen = new Set<string>();

  for (const it of items || []) {
    const url = String(it?.url ?? "").trim();
    const caption = typeof it?.caption === "string" ? it.caption : "";
    if (!url) continue;
    if (!isValidImageUrl(url)) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({ url, caption });
  }

  return out;
}

function extractCreatedId(res: any): string | null {
  if (!res) return null;
  const candidates = [
    res.id,
    res.spotId,
    res.docId,
    res.data?.id,
    res.data?.spotId,
    res.result?.id,
    res.result?.spotId,
  ].filter(Boolean);
  return (candidates[0] as string) || null;
}

function flattenErrors(errObj: any, prefix = ""): Array<{ name: string; message: string }> {
  const out: Array<{ name: string; message: string }> = [];
  if (!errObj) return out;

  for (const key of Object.keys(errObj)) {
    const val = errObj[key];
    const path = prefix ? `${prefix}.${key}` : key;

    if (!val) continue;

    if (typeof val?.message === "string") {
      out.push({ name: path, message: val.message });
      continue;
    }

    if (typeof val === "object") {
      out.push(...flattenErrors(val, path));
    }
  }
  return out;
}

export default function AdminSpotForm() {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const returnTo = (searchParams.get("returnTo") || "").trim();
  const modeHint = (searchParams.get("mode") as SpotMode | null) ?? null;

  const [isLoading, setIsLoading] = useState(false);

  const [saveAfter, setSaveAfter] = useState<"back" | "stay">("back");
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);

  const hasMapKey = Boolean(
    (import.meta as any)?.env?.VITE_GOOGLE_MAPS_API_KEY || (import.meta as any)?.env?.VITE_GOOGLE_MAP_API_KEY
  );
  const [showMap, setShowMap] = useState<boolean>(hasMapKey);

  // ✅ City 직접입력: "자동 적용" UX
  const [useCustomCity, setUseCustomCity] = useState(false);
  const [customCityInput, setCustomCityInput] = useState("");
  const [customCityApplied, setCustomCityApplied] = useState(false);

  // ✅ budgetUnit 자동 추천(카테고리 기반) + 사용자가 수동 변경하면 자동 추천 멈춤
  const [budgetUnitAuto, setBudgetUnitAuto] = useState(true);

  const [showErrorSummary, setShowErrorSummary] = useState(false);
  const topRef = useRef<HTMLDivElement | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    clearErrors,
    setFocus,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<SpotFormValues>({
    resolver: zodResolver(spotSchema),
    defaultValues: {
      mode: modeHint ?? "explorer",
      rating: 4.5,
      priceLevel: 1,
      isSponsored: false,
      images: [],
      latitude: 10.762622,
      longitude: 106.660172,
      category: "",
      name: "",
      locationId: "",
      address: "",
      description: "",
      openHours: "",
      sponsorLevel: "gold",
      sponsorExpiry: "",
      budget: undefined,
      budgetUnit: undefined,
      budgetText: "",
    },
  });

  // ✅ 업로드 UX/정책은 훅으로 통일
  const { uploadSpotImagesWithToast } = useUploadSpotImages();

  const currentImages = watch("images") || [];
  const currentMode = watch("mode") as SpotMode;
  const currentCategory = watch("category") || "";
  const locationId = watch("locationId") || "";
  const lat = watch("latitude");
  const lng = watch("longitude");
  const isSponsored = watch("isSponsored");
  const priceLevel = watch("priceLevel");
  const budgetUnit = watch("budgetUnit");
  const budget = watch("budget");

  const categoryOptions = SPOT_CATEGORIES[currentMode] || [];
  const knownLocation = useMemo(() => POPULAR_LOCATIONS.find((l) => l.id === locationId) ?? null, [locationId]);
  const isKnownLocation = Boolean(knownLocation);
  const hasUnknownLocationValue = Boolean(locationId && !isKnownLocation && !useCustomCity);

  const center = useMemo<LatLng>(
    () => ({ lat: Number(lat) || 10.762622, lng: Number(lng) || 106.660172 }),
    [lat, lng]
  );

  const markers = useMemo<Marker[]>(
    () => [
      {
        id: "selected",
        lat: center.lat,
        lng: center.lng,
        label: "선택 위치",
        title: "선택 위치",
      },
    ],
    [center.lat, center.lng]
  );

  const mapsLink = useMemo(() => {
    const q = `${center.lat},${center.lng}`;
    return `https://www.google.com/maps?q=${encodeURIComponent(q)}`;
  }, [center.lat, center.lng]);

  // Dirty state: 브라우저 이탈 방지
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const goBackToList = () => {
    if (isDirty) {
      const ok = window.confirm("저장하지 않은 변경사항이 있어요. 그래도 나갈까요?");
      if (!ok) return;
    }
    if (returnTo) {
      navigate(decodeURIComponent(returnTo));
      return;
    }
    navigate("/admin/spots");
  };

  // edit 로딩
  useEffect(() => {
    if (!isEditMode || !id) return;

    setIsLoading(true);
    getSpotById(id)
      .then((data: any) => {
        const resolvedMode: SpotMode = (data?.mode as SpotMode) || (modeHint as SpotMode) || "explorer";

        const fromImagesField = Array.isArray(data?.images)
          ? data.images
          : Array.isArray(data?.imageUrls)
            ? data.imageUrls
            : [];
        const imageObjs: Array<{ url: string; caption?: string }> = fromImagesField.map((v: any) =>
          typeof v === "string" ? { url: v, caption: "" } : { url: String(v?.url || ""), caption: v?.caption || "" }
        );

        const rawLocation = String(data?.locationId || data?.region || data?.city || "").trim();

        // budget fields (없으면 undefined)
        const loadedBudget = typeof data?.budget === "number" && Number.isFinite(data.budget) ? data.budget : undefined;
        const loadedBudgetUnit = typeof data?.budgetUnit === "string" ? data.budgetUnit : undefined;
        const loadedBudgetText = typeof data?.budgetText === "string" ? data.budgetText : "";

        // budgetUnit이 이미 저장돼 있으면 "자동 추천"을 꺼둠(운영자가 이미 결정한 값)
        setBudgetUnitAuto(!(loadedBudgetUnit && isBudgetUnit(loadedBudgetUnit)));

        reset({
          name: data?.name ?? "",
          description: data?.description ?? "",
          locationId: rawLocation,
          category: normalizeSpotCategory(resolvedMode, data?.category),
          mode: resolvedMode,
          address: data?.address || data?.location?.address || "",
          latitude: data?.location?.lat ?? data?.latitude ?? 10.762622,
          longitude: data?.location?.lng ?? data?.longitude ?? 106.660172,
          rating: typeof data?.rating === "number" ? data.rating : 4.5,
          priceLevel: isPriceLevel(data?.priceLevel) ? (Math.trunc(data.priceLevel) as any) : 1,
          images: normalizeImages(imageObjs),
          isSponsored: Boolean(data?.isSponsored),
          sponsorLevel: data?.sponsorLevel ?? "gold",
          sponsorExpiry: data?.sponsorExpiry ?? "",
          openHours: typeof data?.openHours === "string" ? data.openHours : "",
          budget: loadedBudget,
          budgetUnit: loadedBudgetUnit && isBudgetUnit(loadedBudgetUnit) ? (loadedBudgetUnit as any) : undefined,
          budgetText: loadedBudgetText,
        });

        const isKnown = POPULAR_LOCATIONS.some((l) => l.id === rawLocation);
        if (rawLocation && !isKnown) {
          setUseCustomCity(true);
          setCustomCityInput(rawLocation);
          setCustomCityApplied(true);
        } else {
          setUseCustomCity(false);
          setCustomCityInput("");
          setCustomCityApplied(false);
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("데이터를 불러오지 못했습니다.");
      })
      .finally(() => setIsLoading(false));
  }, [id, isEditMode, modeHint, reset]);

  // 광고 체크 해제 시 광고필드 정리
  useEffect(() => {
    if (!isSponsored) {
      setValue("sponsorExpiry", "", { shouldDirty: true });
      setValue("sponsorLevel", "gold", { shouldDirty: true });
    }
  }, [isSponsored, setValue]);

  // 모드 변경 시 카테고리 정규화
  useEffect(() => {
    if (!currentCategory) return;

    const normalized = normalizeSpotCategory(currentMode, currentCategory);

    if (!normalized) {
      setValue("category", "", { shouldDirty: true });
      return;
    }

    if (!categoryOptions.includes(normalized)) {
      setValue("category", "", { shouldDirty: true });
      return;
    }

    if (normalized !== currentCategory) {
      setValue("category", normalized, { shouldDirty: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMode]);

  // ✅ 카테고리 변경 시 budgetUnit 자동 추천
  useEffect(() => {
    if (!currentCategory) return;

    const normalizedCategory = normalizeSpotCategory(currentMode, currentCategory);
    if (!normalizedCategory) return;

    const recommended = getDefaultBudgetUnit(currentMode, normalizedCategory);

    const current = String(budgetUnit ?? "").trim();
    const currentIsValid = current ? isBudgetUnit(current) : false;

    // (1) 비어있거나 (2) 자동 추천 모드일 때만 덮어쓰기
    if (!currentIsValid || budgetUnitAuto) {
      setValue("budgetUnit", recommended as any, { shouldDirty: true, shouldValidate: true });
      setBudgetUnitAuto(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMode, currentCategory]);

  // ✅ City 직접입력: "적용" 버튼 없이 자동 반영 + 적용됨 피드백
  useEffect(() => {
    if (!useCustomCity) return;

    const v = customCityInput.trim();
    setCustomCityApplied(false);

    const t = window.setTimeout(() => {
      if (!v) {
        // 입력이 비어있으면 locationId를 비우진 않음(실수 방지) — 에러는 submit 때
        return;
      }
      clearErrors("locationId");
      setValue("locationId", v, { shouldDirty: true, shouldValidate: true });
      setCustomCityApplied(true);
    }, 300);

    return () => window.clearTimeout(t);
  }, [useCustomCity, customCityInput, clearErrors, setValue]);

  // ✅ 이미지 업로드: 훅으로 toast/에러 처리 통일
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);

    const result = await uploadSpotImagesWithToast(files);
    if (result.ok) {
      const merged = normalizeImages([...currentImages, ...result.urls.map((url) => ({ url, caption: "" }))]);
      setValue("images", merged as any, { shouldDirty: true });
    }

    e.target.value = "";
  };

  const cleanImages = () => {
    const before = currentImages.length;
    const afterArr = normalizeImages(currentImages);
    setValue("images", afterArr as any, { shouldDirty: true });
    const removed = before - afterArr.length;
    if (removed > 0) toast.success(`이미지 정리 완료: ${removed}개 제거(중복/빈값/형식오류)`);
    else toast.success("이미지 정리 완료: 제거할 항목 없음");
  };

  const clearAllImages = () => {
    if (!window.confirm("이미지를 전부 삭제할까요?")) return;
    setValue("images", [] as any, { shouldDirty: true });
    toast.success("이미지를 모두 삭제했습니다.");
  };

  const copyCoords = async () => {
    try {
      await navigator.clipboard.writeText(`${center.lat},${center.lng}`);
      toast.success("좌표를 복사했습니다.");
    } catch {
      toast.error("복사에 실패했습니다.");
    }
  };

  const onInvalid = () => {
    setShowErrorSummary(true);
    setSaveMenuOpen(false);

    const list = flattenErrors(errors);
    const first = list[0]?.name;

    if (topRef.current) topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    if (first) {
      const lastKey = first.split(".").slice(-1)[0] as any;
      setTimeout(() => setFocus(lastKey), 50);
    }
  };

  const onSubmit = async (data: SpotFormValues) => {
    setShowErrorSummary(false);
    setSaveMenuOpen(false);

    if (!String(data.locationId || "").trim()) {
      setError("locationId", { type: "manual", message: "지역(City)을 선택/입력해주세요" });
      toast.error("지역(City)을 선택/입력해주세요");
      return;
    }

    const loadingId = toast.loading(isEditMode ? "수정 중..." : "등록 중...");
    try {
      const normalizedCategory = normalizeSpotCategory(data.mode as SpotMode, data.category);

      const normalizedImageObjs = normalizeImages(data.images || []);
      const imageUrls = normalizedImageObjs.map((i) => i.url).filter(Boolean);

      const pl: PriceLevel = isPriceLevel(data.priceLevel) ? (Math.trunc(data.priceLevel) as PriceLevel) : 1;
      const bu: BudgetUnit | undefined =
        data.budgetUnit && isBudgetUnit(data.budgetUnit) ? (data.budgetUnit as any) : undefined;
      const b = data.budget !== undefined ? Number(data.budget) : undefined;

      const payload: any = {
        ...data,

        // ✅ 필드 표준
        priceLevel: pl,
        budget: b,
        budgetUnit: bu,
        budgetText: String(data.budgetText ?? "").trim() || "",

        // images
        images: imageUrls,
        imageUrls,
        thumbnailUrl: imageUrls[0] ?? null,

        // 위치
        location: { lat: data.latitude, lng: data.longitude, address: data.address ?? "" },

        region: data.locationId ?? "",
        locationId: data.locationId ?? "",

        category: normalizedCategory,

        imagesWithCaption: normalizedImageObjs,
      };

      if (!data.isSponsored) {
        payload.sponsorLevel = null;
        payload.sponsorExpiry = null;
      }

      let createdId: string | null = null;

      if (isEditMode) {
        await updateSpot(id!, payload);
      } else {
        const res = await addSpot(payload);
        createdId = extractCreatedId(res);
      }

      toast.success(isEditMode ? "수정되었습니다." : "등록되었습니다.", { id: loadingId });

      if (saveAfter === "stay") {
        reset(
          {
            ...data,
            category: normalizedCategory || "",
            images: normalizedImageObjs,
            priceLevel: pl,
            budget: b,
            budgetUnit: bu,
            budgetText: payload.budgetText,
          },
          { keepDefaultValues: true }
        );

        if (!isEditMode && createdId) {
          const rt = returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : "";
          navigate(`/admin/spots/${createdId}/edit?mode=${data.mode}${rt}`);
        }
        return;
      }

      if (returnTo) {
        navigate(decodeURIComponent(returnTo));
        return;
      }
      navigate("/admin/spots");
    } catch (error) {
      console.error(error);
      toast.error("저장에 실패했습니다.", { id: loadingId });
    }
  };

  const errorList = useMemo(() => flattenErrors(errors), [errors]);

  const labelCls = "block text-sm font-semibold text-gray-700 mb-1";
  const inputCls =
    "w-full p-2.5 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";
  const sectionCls = "bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6";

  const priceLevelLabel = isPriceLevel(priceLevel) ? PRICE_LEVEL_LABELS[Math.trunc(priceLevel) as PriceLevel] : "";

  const budgetUnitLabel = useMemo(() => {
    const v = String(budgetUnit ?? "").trim();
    const found = BUDGET_UNITS.find((u) => u.value === v);
    return found?.label ?? "";
  }, [budgetUnit]);

  return (
    <div className="p-8 max-w-5xl mx-auto" ref={topRef}>
      {/* 상단: 저장/뒤로 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={goBackToList} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <FaArrowLeft /> 뒤로
          </button>

          <h1 className="text-2xl font-bold text-gray-800">{isEditMode ? "장소 수정" : "장소 등록"}</h1>

          {isEditMode && !isDirty && (
            <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">변경사항 없음</span>
          )}

          {isLoading && <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-500">로딩 중…</span>}
        </div>

        {/* 저장 Split 버튼 */}
        <div className="relative">
          <Button
            onClick={handleSubmit(onSubmit, onInvalid)}
            disabled={isSubmitting || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-5 py-2.5 rounded-lg"
          >
            <FaSave className="inline mr-2" /> 저장
          </Button>

          <button
            type="button"
            onClick={() => setSaveMenuOpen((v) => !v)}
            className="ml-2 inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-50"
            aria-label="저장 옵션"
          >
            <FaChevronDown />
          </button>

          {saveMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-20">
              <button
                type="button"
                onClick={() => {
                  setSaveAfter("back");
                  setSaveMenuOpen(false);
                  toast.success("저장 후 목록으로 이동");
                }}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 text-sm ${
                  saveAfter === "back" ? "font-bold" : ""
                }`}
              >
                저장 후 목록으로
              </button>
              <button
                type="button"
                onClick={() => {
                  setSaveAfter("stay");
                  setSaveMenuOpen(false);
                  toast.success("저장 후 계속 편집");
                }}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 text-sm ${
                  saveAfter === "stay" ? "font-bold" : ""
                }`}
              >
                저장 후 계속 편집
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 에러 요약 */}
      {showErrorSummary && errorList.length > 0 && (
        <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50">
          <div className="font-bold text-red-800 mb-2">필수 입력/형식 오류가 있어요</div>
          <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
            {errorList.slice(0, 8).map((e) => (
              <li key={e.name}>{e.message}</li>
            ))}
          </ul>
          {errorList.length > 8 && (
            <div className="text-xs text-red-700 mt-2">외 {errorList.length - 8}개 오류가 더 있어요.</div>
          )}
        </div>
      )}

      {/* Mode */}
      <div className={sectionCls}>
        <h2 className="text-lg font-bold text-gray-800 mb-4">구분</h2>
        <div className="grid grid-cols-2 gap-3">
          <label
            className={`border rounded-lg p-4 flex items-center justify-between ${
              currentMode === "explorer" ? "border-blue-500 bg-blue-50" : "border-gray-200"
            } ${isEditMode ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
            title={isEditMode ? "수정 화면에서는 mode 변경이 불가합니다." : ""}
          >
            <div className="flex items-center gap-3">
              <FaSun className="text-yellow-500" />
              <div>
                <div className="font-bold">Explorer (Day)</div>
                <div className="text-xs text-gray-500">맛집/카페/관광/호텔</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditMode ? <FaLock className="text-gray-400" /> : null}
              <input type="radio" value="explorer" {...register("mode")} disabled={isEditMode} />
            </div>
          </label>

          <label
            className={`border rounded-lg p-4 flex items-center justify-between ${
              currentMode === "nightlife" ? "border-purple-500 bg-purple-50" : "border-gray-200"
            } ${isEditMode ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
            title={isEditMode ? "수정 화면에서는 mode 변경이 불가합니다." : ""}
          >
            <div className="flex items-center gap-3">
              <FaMoon className="text-purple-600" />
              <div>
                <div className="font-bold">Nightlife (Night)</div>
                <div className="text-xs text-gray-500">클럽/바/가라오케/라운지</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditMode ? <FaLock className="text-gray-400" /> : null}
              <input type="radio" value="nightlife" {...register("mode")} disabled={isEditMode} />
            </div>
          </label>
        </div>

        {isEditMode && <p className="text-xs text-gray-400 mt-2">운영 사고 방지를 위해 수정 시 mode 변경을 막아두었습니다.</p>}
      </div>

      {/* Basic */}
      <div className={sectionCls}>
        <h2 className="text-lg font-bold text-gray-800 mb-4">기본 정보</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>이름 *</label>
            <input className={inputCls} {...register("name")} />
            {errors.name && <p className="text-xs text-red-600 mt-1">{String(errors.name.message)}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className={labelCls}>지역(City) *</label>

              <div className="flex items-center gap-2">
                {hasUnknownLocationValue && (
                  <span className="text-[11px] px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-800">
                    알 수 없는 값: {locationId}
                  </span>
                )}
                {useCustomCity && customCityApplied && (
                  <span className="text-[11px] px-2 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-700">
                    적용됨
                  </span>
                )}
                <button
                  type="button"
                  className="text-xs underline text-gray-600 hover:text-gray-900"
                  onClick={() => {
                    setUseCustomCity((v) => !v);
                    setCustomCityInput(locationId || "");
                    setCustomCityApplied(false);
                  }}
                >
                  {useCustomCity ? "선택으로" : "직접입력"}
                </button>
              </div>
            </div>

            {!useCustomCity ? (
              <select className={inputCls} {...register("locationId")}>
                <option value="">선택</option>
                {hasUnknownLocationValue && <option value={locationId}>{locationId}</option>}
                {POPULAR_LOCATIONS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex flex-col gap-1">
                <input
                  className={inputCls}
                  value={customCityInput}
                  onChange={(e) => {
                    setCustomCityInput(e.target.value);
                    setCustomCityApplied(false);
                  }}
                  placeholder="예) Hanoi / Ho Chi Minh City / Da Nang ..."
                />
                <p className="text-xs text-gray-400">직접입력 값은 자동으로 반영됩니다. (버튼 없이 자동 적용)</p>
              </div>
            )}

            {isKnownLocation && (
              <p className="text-xs text-gray-400 mt-1">
                선택됨: <span className="font-semibold">{knownLocation?.name}</span> ({knownLocation?.id})
              </p>
            )}

            {errors.locationId && <p className="text-xs text-red-600 mt-1">{String(errors.locationId.message)}</p>}
          </div>

          <div>
            <label className={labelCls}>카테고리 *</label>
            <select className={inputCls} {...register("category")}>
              <option value="">선택</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">카테고리 변경 시 “예산 단위”가 자동 추천됩니다.</p>
            {errors.category && <p className="text-xs text-red-600 mt-1">{String(errors.category.message)}</p>}
          </div>

          <div>
            <label className={labelCls}>평점</label>
            <input type="number" step="0.1" className={inputCls} {...register("rating", { valueAsNumber: true })} />
          </div>

          {/* ✅ 가격대(등급) */}
          <div>
            <label className={labelCls}>가격대(등급) *</label>
            <select className={inputCls} {...register("priceLevel", { valueAsNumber: true })} aria-label="가격대(등급)">
              {PRICE_LEVEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.value} · {o.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              필터/정렬용 등급입니다. (현재 선택: <span className="font-semibold">{priceLevelLabel}</span>)
            </p>
            {errors.priceLevel && <p className="text-xs text-red-600 mt-1">{String(errors.priceLevel.message)}</p>}
          </div>

          <div>
            <label className={labelCls}>영업 시간</label>
            <input className={inputCls} placeholder="예: 10:00 - 22:00" {...register("openHours")} />
          </div>

          {/* ✅ 표시용 예산 */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between">
              <label className={labelCls}>예산(표시용)</label>
              {budgetUnitAuto ? (
                <span className="text-[11px] px-2 py-1 rounded bg-gray-50 border border-gray-200 text-gray-600">
                  단위 자동 추천 ON
                </span>
              ) : (
                <span className="text-[11px] px-2 py-1 rounded bg-gray-50 border border-gray-200 text-gray-600">
                  단위 수동 설정
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <input
                  type="number"
                  className={inputCls}
                  placeholder="예: 150000"
                  {...register("budget", {
                    valueAsNumber: true,
                    setValueAs: (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
                  })}
                />
                <p className="text-xs text-gray-400 mt-1">유저에게 실제 금액으로 표시됩니다. (VND 기준 권장)</p>
                {errors.budget && <p className="text-xs text-red-600 mt-1">{String(errors.budget.message)}</p>}
              </div>

              <div>
                <select
                  className={inputCls}
                  {...register("budgetUnit")}
                  onChange={(e) => {
                    // 사용자가 손으로 바꾸면 이후 자동 추천 멈춤
                    setBudgetUnitAuto(false);
                    setValue("budgetUnit", e.target.value as any, { shouldDirty: true, shouldValidate: true });
                  }}
                >
                  <option value="">단위 선택</option>
                  {BUDGET_UNITS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {budgetUnitLabel ? `선택됨: ${budgetUnitLabel}` : "카테고리에 맞게 추천됩니다."}
                </p>
                {errors.budgetUnit && <p className="text-xs text-red-600 mt-1">{String(errors.budgetUnit.message)}</p>}
              </div>

              <div>
                <input
                  className={inputCls}
                  placeholder="예: 주말 상이 / 시즌별 변동 / 세금·봉사료 별도"
                  {...register("budgetText")}
                />
                <p className="text-xs text-gray-400 mt-1">변동 가능성이 있으면 꼭 적어주세요. CS 문의가 크게 줄어요.</p>
              </div>
            </div>

            <div className="mt-2 text-xs text-gray-500">
              예산이 없으면 유저 화면에서는 “가격대(등급)”만 보일 수 있어요. 가능하면 예산을 입력하는 걸 권장합니다.
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className={labelCls}>주소</label>
          <input className={inputCls} {...register("address")} />
        </div>

        <div className="mt-4">
          <label className={labelCls}>설명</label>
          <textarea className={`${inputCls} h-28 resize-none`} {...register("description")} />
        </div>
      </div>

      {/* Images */}
      <div className={sectionCls}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800">이미지</h2>
            <p className="text-xs text-gray-400 mt-1">
              드래그로 순서 변경 가능 / <span className="font-semibold">1번이 대표 이미지</span>로 노출됩니다.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cleanImages}
              className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm font-bold"
              title="중복/빈값/형식오류 제거"
            >
              <FaBroom /> 정리
            </button>

            <button
              type="button"
              onClick={clearAllImages}
              className="inline-flex items-center gap-2 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg text-sm font-bold text-red-700"
              title="전체 삭제"
            >
              <FaTrashAlt /> 전체삭제
            </button>

            <label className="inline-flex items-center gap-2 cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg">
              <FaCloudUploadAlt />
              <span className="text-sm font-bold">업로드</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
            </label>
          </div>
        </div>

        <ImageSorter
          images={currentImages as any}
          onRemove={(index) => {
            const next = [...currentImages];
            next.splice(index, 1);
            setValue("images", next as any, { shouldDirty: true });
          }}
          onReorder={(newImages) => {
            const next = (newImages || []).map((i: any) => ({ url: String(i.url || ""), caption: i.caption || "" }));
            setValue("images", next as any, { shouldDirty: true });
          }}
        />
      </div>

      {/* Map */}
      <div className={sectionCls}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">지도 위치</h2>

          <div className="flex items-center gap-2">
            <a
              href={mapsLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-bold"
              title="Google Maps로 열기"
            >
              <FaExternalLinkAlt /> 지도 열기
            </a>

            <button
              type="button"
              onClick={copyCoords}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-bold"
              title="좌표 복사"
            >
              <FaCopy /> 좌표 복사
            </button>

            <button
              type="button"
              onClick={() => setShowMap((v) => !v)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-bold"
              title="지도 접기/펼치기"
            >
              {showMap ? <FaChevronUp /> : <FaChevronDown />} 지도
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelCls}>위도</label>
            <input type="number" step="0.000001" className={inputCls} {...register("latitude", { valueAsNumber: true })} />
          </div>
          <div>
            <label className={labelCls}>경도</label>
            <input type="number" step="0.000001" className={inputCls} {...register("longitude", { valueAsNumber: true })} />
          </div>
        </div>

        {!hasMapKey ? (
          <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-sm">
            Google Maps API Key가 설정되지 않아 지도는 숨김 처리됩니다. (좌표 입력/복사/외부 지도 링크는 사용 가능)
          </div>
        ) : showMap ? (
          <>
            <MapWrapper>
              <GoogleMap
                center={center}
                markers={markers}
                onClick={(p) => {
                  setValue("latitude", p.lat, { shouldDirty: true });
                  setValue("longitude", p.lng, { shouldDirty: true });
                }}
              />
            </MapWrapper>
            <p className="text-xs text-gray-400 mt-2">지도 클릭으로 좌표를 설정할 수 있습니다.</p>
          </>
        ) : (
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 text-sm">
            지도는 접혀있습니다. 필요하면 “지도” 버튼으로 펼쳐주세요.
          </div>
        )}
      </div>

      {/* Sponsor */}
      <div className={sectionCls}>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FaCrown className="text-amber-500" /> 광고(스폰서)
        </h2>

        <label className="inline-flex items-center gap-2">
          <input type="checkbox" {...register("isSponsored")} />
          <span className="font-bold">광고로 노출</span>
        </label>

        {isSponsored && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>등급 *</label>
              <select className={inputCls} {...register("sponsorLevel")}>
                <option value="gold">gold</option>
                <option value="silver">silver</option>
                <option value="banner">banner</option>
                <option value="slider">slider</option>
                <option value="infeed">infeed</option>
              </select>
              {errors.sponsorLevel && <p className="text-xs text-red-600 mt-1">{String(errors.sponsorLevel.message)}</p>}
            </div>

            <div>
              <label className={labelCls}>만료일 *</label>
              <input type="date" className={inputCls} {...register("sponsorExpiry")} />
              <div className="text-xs text-gray-400 mt-1">
                추천:{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={() => setValue("sponsorExpiry", addDaysISO(7), { shouldDirty: true })}
                >
                  +7일
                </button>{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={() => setValue("sponsorExpiry", addDaysISO(30), { shouldDirty: true })}
                >
                  +30일
                </button>
              </div>
              {errors.sponsorExpiry && <p className="text-xs text-red-600 mt-1">{String(errors.sponsorExpiry.message)}</p>}
            </div>
          </div>
        )}
      </div>

      {/* 하단 저장 */}
      <div className="mt-8 flex justify-end">
        <Button
          onClick={handleSubmit(onSubmit, onInvalid)}
          disabled={isSubmitting || isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg"
        >
          <FaSave className="inline mr-2" /> 저장
        </Button>
      </div>
    </div>
  );
}
