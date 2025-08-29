// src/pages/AdminSeed.tsx
import Button from "@/components/ui/Button";
import { useState } from "react";
import { seedTaxonomies, seedPlaces, seedSampleReviews } from "@/lib/seed";

export default function AdminSeed() {
    const [busy, setBusy] = useState(false);
    const [log, setLog] = useState<string[]>([]);

    const run = async (label: string, fn: () => Promise<void>) => {
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
                <Button disabled={busy} onClick={() => run("분류(카테고리/도시) 시드", seedTaxonomies)}>
                    분류(카테고리/도시) 시드
                </Button>
                <Button disabled={busy} onClick={() => run("장소 시드 추가", seedPlaces)} variant="outline">
                    장소 시드 추가
                </Button>
                <Button disabled={busy} onClick={() => run("샘플 리뷰 시드 추가", seedSampleReviews)} variant="subtle">
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
                    <li>운영 배포 시 이 라우트는 삭제하거나 접근 제한을 걸어주세요.</li>
                    <li>리뷰의 <code>placeId</code>는 실제 운영에서 <strong>places 문서 ID</strong>를 참조해야 합니다.</li>
                </ul>
            </div>
        </div>
    );
}
