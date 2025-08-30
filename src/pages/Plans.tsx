// src/pages/Plans.tsx
import { useState } from "react";
import Button from "@/components/ui/Button";
import { Card, CardTitle, CardText } from "@/components/ui/Card";

export default function Plans() {
    const [days, setDays] = useState(2);
    const [budget, setBudget] = useState(50);
    const [mood, setMood] = useState<"chill" | "party" | "live" | "golf">("chill");
    const [plans, setPlans] = useState<
        { day: number; title: string; items: string[] }[]
    >([]);

    const makePlan = () => {
        // (MVP) 간단 추천 더미 — Part 6에서 실제 API 연결 가능
        const base = Array.from({ length: days }).map((_, i) => ({
            day: i + 1,
            title: `Day ${i + 1} · ${mood.toUpperCase()}`,
            items:
                mood === "golf"
                    ? ["오전 라운딩", "점심 & 마사지", "저녁 라운지"]
                    : mood === "party"
                        ? ["카페/브런치", "시내 투어", "밤바/클럽"]
                        : mood === "live"
                            ? ["카페/브런치", "라이브 바", "루프탑 라운지"]
                            : ["카페/브런치", "스파/마사지", "라운지/바"],
        }));
        setPlans(base);
    };

    return (
        <div className="grid gap-6">
            <h1 className="text-xl font-bold text-fg-title">플랜</h1>

            <div className="grid gap-2 md:grid-cols-2">
                <label className="grid gap-1 text-sm">
                    <span className="text-fg-muted">일정(일)</span>
                    <input
                        type="number"
                        value={days}
                        min={1}
                        onChange={(e) => setDays(+e.target.value)}
                        className="rounded-xl border border-border-subtle bg-white px-3 py-2 dark:bg-bg-muted"
                    />
                </label>

                <label className="grid gap-1 text-sm">
                    <span className="text-fg-muted">1일 예산(USD)</span>
                    <input
                        type="number"
                        value={budget}
                        min={10}
                        step={10}
                        onChange={(e) => setBudget(+e.target.value)}
                        className="rounded-xl border border-border-subtle bg-white px-3 py-2 dark:bg-bg-muted"
                    />
                </label>

                <label className="grid gap-1 text-sm">
                    <span className="text-fg-muted">분위기</span>
                    <select
                        value={mood}
                        onChange={(e) => setMood(e.target.value as any)}
                        className="rounded-xl border border-border-subtle bg-white px-3 py-2 dark:bg-bg-muted"
                    >
                        <option value="chill">Chill</option>
                        <option value="party">Party</option>
                        <option value="live">Live</option>
                        <option value="golf">Golf</option>
                    </select>
                </label>
            </div>

            <Button className="w-fit" onClick={makePlan}>
                추천 코스 만들기
            </Button>

            <div className="grid gap-3">
                {plans.length === 0 ? (
                    <div className="rounded-xl border border-border-subtle p-3 text-sm text-fg-muted">
                        (MVP) 버튼을 누르면 추천 코스 카드가 여기에 나타납니다.
                    </div>
                ) : (
                    plans.map((p) => (
                        <Card key={p.day}>
                            <CardTitle>{p.title}</CardTitle>
                            <CardText className="grid gap-1 text-sm">
                                {p.items.map((it, i) => (
                                    <div key={i}>• {it}</div>
                                ))}
                            </CardText>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
