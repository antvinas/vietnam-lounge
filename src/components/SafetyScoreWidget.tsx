type Score = { clean: number; price: number; kindness: number; ambiance: number; commute: number }
export default function SafetyScoreWidget({ score }: { score: Score }) {
    const items = [
        { k: '청결', v: score.clean }, { k: '가격투명', v: score.price }, { k: '친절', v: score.kindness },
        { k: '분위기', v: score.ambiance }, { k: '귀가동선', v: score.commute },
    ]
    return (
        <div className="grid grid-cols-5 gap-2 rounded-xl border border-border-subtle p-3">
            {items.map(it => (
                <div key={it.k} className="text-center">
                    <div className="text-xs text-fg-muted">{it.k}</div>
                    <div className="text-lg font-bold text-brand-secondary">{it.v.toFixed(1)}</div>
                </div>
            ))}
        </div>
    )
}
