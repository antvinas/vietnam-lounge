// src/pages/Adult.tsx
import { useApp } from "@/context/AppContext";
import { Card, CardTitle, CardText } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function Adult() {
    const { adultAllowed, setAdultAllowed } = useApp();

    if (!adultAllowed) {
        return (
            <div className="rounded-xl border border-border-subtle p-4 text-sm text-fg-muted">
                성인(19+) 섹션 접근에는 동의가 필요합니다. 상단 19+ 버튼을 눌러 동의 후 다시 접근하세요.
                <div className="mt-2">
                    <Button variant="outline" onClick={() => setAdultAllowed(true)}>
                        (테스트용) 동의 처리
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="grid gap-6">
            <h1 className="text-xl font-bold text-fg-title">성인(19+) 정보</h1>
            <Card>
                <CardTitle>운영 정책</CardTitle>
                <CardText className="text-sm">
                    야간 장소의 정보·후기 전용. 연락처/알선/노골 콘텐츠 금지. 위반 시 제재.
                </CardText>
            </Card>
            <Card>
                <CardTitle>카테고리</CardTitle>
                <CardText className="text-sm">
                    라운지, 바, 클럽, 가라오케 등. 정책 범위 내 정보만 허용됩니다.
                </CardText>
            </Card>
        </div>
    );
}
