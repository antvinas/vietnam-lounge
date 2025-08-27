import { useEffect, useState } from 'react'
import { getPlaces, getReviewsForPlace } from '../lib/api'
import PlaceCard from '../components/PlaceCard'
import ReviewCard from '../components/ReviewCard'
import type { Place, Review } from '../types'

export default function Home() {
    const [places, setPlaces] = useState<Place[]>([])
    const [reviews, setReviews] = useState<Review[]>([])
    useEffect(() => {
        (async () => {
            const p = await getPlaces(); setPlaces(p.slice(0, 2))
            const r1 = await getReviewsForPlace('p1'); const r2 = await getReviewsForPlace('p2')
            setReviews([...r1.slice(0, 1), ...r2.slice(0, 1)])
        })()
    }, [])

    return (
        <div className="grid gap-8">
            <section>
                <h2 className="mb-3 text-xl font-bold text-fg-title">오늘의 도시별 핫스팟</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {places.map(p => <PlaceCard key={p.id} place={p} />)}
                </div>
            </section>
            <section>
                <h2 className="mb-3 text-xl font-bold text-fg-title">신규 후기</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
                </div>
            </section>
        </div>
    )
}
