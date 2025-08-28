// src/pages/Events.tsx
import { Card, CardTitle, CardText } from "@/components/ui/Card";

export default function Events() {
    return (
        <div className="grid gap-6">
            <h1 className="text-xl font-bold text-fg-title">이벤트</h1>
            <Card>
                <CardTitle>라이브/해피아워/골프 프로모션</CardTitle>
                <CardText className="text-sm">
                    캘린더/카드로 노출됩니다. (MVP: 정적 목록 Stub)
                </CardText>
            </Card>
        </div>
    );
}
