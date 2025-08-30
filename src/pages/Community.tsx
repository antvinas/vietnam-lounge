// src/pages/Community.tsx
import { Card, CardTitle, CardText } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/Toast";

export default function Community() {
    const { addToast } = useToast();

    return (
        <div className="grid gap-6">
            <h1 className="text-xl font-bold text-fg-title">커뮤니티</h1>

            <Card>
                <CardTitle>Q&A / 후기</CardTitle>
                <CardText className="text-sm">
                    여행 팁/후기/질문을 올려보세요. (MVP: 리스트 UI Stubs)
                </CardText>
                <div className="mt-3">
                    <Button
                        variant="outline"
                        onClick={() =>
                            addToast({ title: "준비 중", desc: "작성 폼은 곧 열립니다." })
                        }
                    >
                        글쓰기
                    </Button>
                </div>
            </Card>

            <Card>
                <CardTitle>동행/소모임</CardTitle>
                <CardText className="text-sm">
                    여성 전용 설정, 안전 공지 등 운영정책이 적용됩니다. (MVP Stub)
                </CardText>
            </Card>
        </div>
    );
}
