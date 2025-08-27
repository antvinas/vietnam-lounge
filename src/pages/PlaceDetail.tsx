import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { addReview, getPlace, getReviewsForPlace, reportPlace } from '../lib/api'
import SafetyScoreWidget from '../components/SafetyScoreWidget'
import Badge from '../components/ui/Badge'
import ReviewCard from '../components/ReviewCard'
import ReviewForm from '../components/ReviewForm'
import ReportDialog from '../components/ReportDialog'
import Button from '../components/ui/Button'
import type { Place, Review } from '../types'

export default function PlaceDetail() {
    const { id = '' } = useParams()
    const [place, setPlace] = useState<Place | null>(null)
    const [reviews, setReviews] = useState<Review[]>([])

    useEffect(() => {
        (async () => {
            setPlace(await getPlace(id))
            setReviews(await getReviewsForPlace(id))
        })()
    }, [id])

    if (!place) return <div className="text-fg-muted">로딩 중...</div>

    return (
        <div className="grid gap-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-fg-title">{place.name}</h1>
                    <div className="text-sm text-fg-muted">{place.city} · {place.category}</div>
                </div>
                <ReportDialog
                    onReport={(reason) => reportPlace(place.id, reason)}
                    trigger={<Button variant="outline">신고</Button>}
                />
            </div>

            <SafetyScoreWidget score={place.score} />
            <div className="flex flex-wrap gap-2">{place.tags.map(t => <Badge key={t}>{t}</Badge>)}</div>

            <section className="grid gap-3">
                <h2 className="text-xl font-bold text-fg-title">리뷰</h2>
                {reviews.length === 0 && <div className="rounded-xl border border-border-subtle p-3 text-sm text-fg-muted">아직 리뷰가 없습니다.</div>}
                {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
                <div className="rounded-xl border border-border-subtle p-3">
                    <h3 className="mb-2 font-semibold text-fg-title">리뷰 작성</h3>
                    <ReviewForm onSubmit={async (user, rating, text) => { await addReview({ placeId: place.id, user, rating, text }); setReviews(await getReviewsForPlace(place.id)) }} />
                </div>
            </section>
        </div>
    )
}
