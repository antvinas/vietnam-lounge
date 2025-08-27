import Button from './ui/Button'
import { useState } from 'react'

export default function ReviewForm({ onSubmit }: { onSubmit: (user: string, rating: number, text: string) => Promise<void> }) {
    const [user, setUser] = useState('@guest')
    const [rating, setRating] = useState(4)
    const [text, setText] = useState('')

    return (
        <form className="grid gap-2" onSubmit={async (e) => { e.preventDefault(); await onSubmit(user, rating, text); setText('') }}>
            <div className="grid gap-1 text-sm">
                <label className="text-fg-muted">닉네임</label>
                <input className="rounded-xl border border-border-subtle bg-white px-3 py-2 dark:bg-bg-muted" value={user} onChange={e => setUser(e.target.value)} required />
            </div>
            <div className="grid gap-1 text-sm">
                <label className="text-fg-muted">평점 (1~5)</label>
                <input type="number" min={1} max={5} className="rounded-xl border border-border-subtle bg-white px-3 py-2 dark:bg-bg-muted" value={rating} onChange={e => setRating(+e.target.value)} required />
            </div>
            <div className="grid gap-1 text-sm">
                <label className="text-fg-muted">리뷰</label>
                <textarea className="rounded-xl border border-border-subtle bg-white px-3 py-2 dark:bg-bg-muted" value={text} onChange={e => setText(e.target.value)} required />
            </div>
            <Button type="submit" className="w-fit">등록</Button>
        </form>
    )
}
