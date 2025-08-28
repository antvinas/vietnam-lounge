// src/pages/AdminSeed.tsx
import Button from "@/components/ui/Button";
import { seedPlaces, seedSampleReviews } from "@/lib/seed";
import { useState } from "react";

export default function AdminSeed() {
    const [busy, setBusy] = useState(false);
    const [log, setLog] = useState<string[]>([]);

    const run = async (fn: () => Promise<void>, label: string) => {
        try {
            setBusy(true);
            setLog((x) => [...x, `▶ ${label}...`]);
            await fn();
            setLog((x) => [...x, `✔ ${label} 완료`]);
        } catch (e: any) {
            setLog((x) => [...x, `✖ ${label} 실패: ${e?.message ?? e}`]);
        } finally {
            setBusy(false);
        }
    };

    if (!import.meta.env.DEV) {
        return (
            <div className="rounded-xl border border-border-subtle p-4 text-sm text-fg-muted">
                이 페이지는 개발 모드에서만 접근 가능합니다.
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            <h1 className="text-xl font-bold text-fg-title">시드 데이터 주입 (DEV)</h1>
            <div className="grid gap-2 md:grid-cols-2">
                <Button disabled={busy} onClick={() => run(seedPlaces, "장소 시드 추가")}>
                    장소 시드 추가
                </Button>
                <Button
                    disabled={busy}
                    onClick={() => run(seedSampleReviews, "샘플 리뷰 시드 추가")}
                    variant="outline"
                >
                    샘플 리뷰 시드 추가
                </Button>
            </div>

            <div className="rounded-xl border border-border-subtle p-3 text-xs text-fg-muted">
                <div className="mb-1 font-semibold text-fg-title">로그</div>
                {log.length === 0 ? <div>없음</div> : log.map((l, i) => <div key={i}>{l}</div>)}
            </div>

            <div className="rounded-xl border border-border-subtle p-3 text-xs text-fg-muted">
                <div className="mb-1 font-semibold text-fg-title">주의</div>
                <ul className="list-disc pl-4">
                    <li>이 페이지는 개발 중 빠른 검증을 위한 용도입니다.</li>
                    <li>운영 배포 시 이 라우트를 제거하거나 접근 제한을 거세요.</li>
                    <li>리뷰 시드의 <code>placeId</code>는 샘플로 장소 이름을 사용합니다. 운영에서는 places 문서ID로 교체하세요.</li>
                </ul>
            </div>
        </div>
    );
}
