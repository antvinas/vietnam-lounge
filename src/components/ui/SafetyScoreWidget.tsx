// src/components/SafetyScoreWidget.tsx
import {
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

type Score = {
    clean: number;     // 청결
    price: number;     // 가격투명
    kindness: number;  // 응대친절
    ambiance: number;  // 분위기
    commute: number;   // 귀가동선
};

const LABELS: Record<keyof Score, string> = {
    clean: "청결",
    price: "가격투명",
    kindness: "친절",
    ambiance: "분위기",
    commute: "귀가동선",
};

export default function SafetyScoreWidget({ score }: { score: Score }) {
    const data = (Object.keys(score) as (keyof Score)[]).map((k) => ({
        key: k,
        label: LABELS[k],
        value: Number(score[k] ?? 0),
    }));

    return (
        <div className="rounded-xl border border-border-subtle p-3">
            <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-medium text-fg-title">여성안심 지수</div>
                <div className="text-xs text-fg-muted">1 ~ 5</div>
            </div>
            <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={data}>
                        <PolarGrid stroke="var(--border-strong)" />
                        <PolarAngleAxis
                            dataKey="label"
                            tick={{ fill: "var(--fg-muted)", fontSize: 12 }}
                        />
                        <PolarRadiusAxis
                            angle={90}
                            domain={[0, 5]}
                            tick={{ fill: "var(--fg-muted)", fontSize: 10 }}
                            stroke="var(--border-strong)"
                        />
                        <Tooltip
                            formatter={(v: number) => v.toFixed(1)}
                            contentStyle={{
                                background: "var(--bg-base)",
                                border: "1px solid var(--border-subtle)",
                                borderRadius: 12,
                            }}
                        />
                        <Radar
                            name="안심지수"
                            dataKey="value"
                            stroke="var(--brand-secondary)"
                            fill="var(--brand-primary)"
                            fillOpacity={0.35}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
