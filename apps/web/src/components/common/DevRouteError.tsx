import React, { useEffect, useMemo } from "react";

type Props = {
  error?: unknown;
  title?: string;
  resetHref?: string;
  className?: string;
};

/** 라우트 에러 표시용 공통 컴포넌트(개발 모드 친화) */
export default function DevRouteError({
  error,
  title = "오류가 발생했습니다",
  resetHref = "/",
  className = "",
}: Props) {
  const info = useMemo(() => normalizeError(error), [error]);

  useEffect(() => {
    // 콘솔로 전체 에러 출력
    // eslint-disable-next-line no-console
    console.error("[DevRouteError]", info.raw);
  }, [info]);

  return (
    <main className={`mx-auto max-w-3xl px-4 py-10 ${className}`}>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h1>

        <p className="mt-2 text-slate-600 dark:text-slate-300 text-sm">
          {info.message}
        </p>

        <div className="mt-4 grid gap-2 text-xs">
          {info.status && (
            <Row k="Status" v={`${info.status} ${info.statusText ?? ""}`} />
          )}
          <Row k="Path" v={info.path} />
          <Row k="Method" v={info.method} />
          <Row k="Time" v={new Date().toISOString()} />
        </div>

        {info.stack && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-slate-700 dark:text-slate-200">
              스택 보기
            </summary>
            <pre className="mt-2 overflow-auto rounded-lg bg-slate-900/90 p-3 text-[11px] text-emerald-200">
              {info.stack}
            </pre>
          </details>
        )}

        {info.data && (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm">추가 데이터</summary>
            <pre className="mt-2 overflow-auto rounded-lg bg-slate-900/90 p-3 text-[11px] text-sky-200">
              {JSON.stringify(info.data, null, 2)}
            </pre>
          </details>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <a
            href={resetHref}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white"
          >
            초기화하고 돌아가기
          </a>
          <button
            type="button"
            onClick={() => location.reload()}
            className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm"
          >
            새로고침
          </button>
          <button
            type="button"
            onClick={() => copyDebug(info)}
            className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm"
          >
            디버그 복사
          </button>
        </div>
      </div>
    </main>
  );
}

function Row({ k, v }: { k: string; v?: string }) {
  if (!v) return null;
  return (
    <div className="grid grid-cols-[96px_1fr] gap-3">
      <div className="text-slate-500">{k}</div>
      <div className="text-slate-700 dark:text-slate-200 break-all">{v}</div>
    </div>
  );
}

function normalizeError(err: unknown) {
  const loc =
    typeof window !== "undefined"
      ? { path: location.pathname + location.search, method: "GET" }
      : { path: "", method: "" };

  // react-router errorResponse 호환
  const any = err as any;
  const message =
    any?.message ||
    any?.statusText ||
    "원인을 식별할 수 없는 오류입니다. 콘솔 로그를 확인하세요.";
  const stack = typeof any?.stack === "string" ? any.stack : undefined;
  const status = typeof any?.status === "number" ? any.status : undefined;
  const statusText =
    typeof any?.statusText === "string" ? any.statusText : undefined;
  const data = any?.data ?? any?.cause ?? undefined;

  return {
    message,
    stack,
    status,
    statusText,
    data,
    path: loc.path,
    method: loc.method,
    raw: err,
  };
}

async function copyDebug(info: ReturnType<typeof normalizeError>) {
  try {
    const payload = {
      when: new Date().toISOString(),
      path: info.path,
      status: info.status,
      statusText: info.statusText,
      message: info.message,
      stack: info.stack,
      data: info.data,
      ua: typeof navigator !== "undefined" ? navigator.userAgent : "",
    };
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    alert("디버그 정보를 복사했습니다.");
  } catch {
    alert("클립보드 복사에 실패했습니다.");
  }
}
