import { Card, CardTitle, CardText } from './ui/Card'
import Badge from './ui/Badge'
import SafetyScoreWidget from './SafetyScoreWidget'
import Button from './ui/Button'
import type { Place } from '../types'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function PlaceCard({ place }: { place: Place }) {
    const { bookmarks, toggle } = useApp()
    const saved = bookmarks.has(place.id)

    return (
        <Card>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>{place.name}</CardTitle>
                    <CardText className="text-sm text-fg-muted">{place.city} · {place.category}</CardText>
                </div>
                {place.verified && <span className="rounded-full bg-brand-accent/20 px-3 py-1 text-xs font-medium text-brand-secondary">Verified</span>}
            </div>

            <div className="mt-3"><SafetyScoreWidget score={place.score} /></div>

            <div className="mt-3 flex flex-wrap gap-2">
                {place.tags.map(t => <Badge key={t}>{t}</Badge>)}
            </div>

            <div className="mt-4 flex gap-2">
                <Link to={`/place/${place.id}`} className="inline-flex"><Button variant="outline">자세히</Button></Link>
                <Button variant="primary" onClick={() => toggle(place.id)}>{saved ? '저장됨' : '저장'}</Button>
            </div>
        </Card>
    )
}
