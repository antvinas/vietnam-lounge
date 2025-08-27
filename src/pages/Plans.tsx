import Button from '../components/ui/Button'
import { useState } from 'react'

export default function Plans() {
    const [days, setDays] = useState(2)
    const [budget, setBudget] = useState(50)

    return (
        <div className="grid gap-4">
            <h1 className="text-xl font-bold text-fg-title">플랜</h1>
            <div className="grid gap-2 md:grid-cols-2">
                <label className="grid gap-1 text-sm">
                    <span className="text-fg-muted">일정(일)</span>
                    <input type="number" value={days} min={1} onChange={e => setDays(+e.target.value)} className="rounded-xl border border-border-subtle bg-white px-3 py-2 dark:bg-bg-muted" />
                </label>
                <label className="grid gap-1 text-sm">
                    <span className="text-fg-muted">1일 예산(USD)</span>
                    <input type="number" value={budget} min={10} step={10} onChange={e => setBudget(+e.target.value)} className="rounded-xl border border-border-subtle bg-white px-3 py-2 dark:bg-bg-muted" />
                </label>
            </div>
            <Button className="w-fit">추천 코스 만들기</Button>
            <div className="rounded-xl border border-border-subtle p-3 text-sm text-fg-muted">
                (MVP) 버튼을 누르면 추천 코스 카드가 여기에 나타납니다.
            </div>
        </div>
    )
}
