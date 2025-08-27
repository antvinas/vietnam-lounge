import { Card } from './ui/Card'
import type { Review } from '../types'

export default function ReviewCard({ review }: { review: Review }) {
    return (
        <Card>
            <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-fg-title">{review.user}</span>
                <span className="text-fg-muted">★ {review.rating.toFixed(1)}</span>
            </div>
            <p className="text-sm text-fg-body">{review.text}</p>
            <div className="mt-2 text-[11px] text-fg-muted">{review.createdAt}</div>
        </Card>
    )
}
