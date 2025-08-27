import { useEffect, useState } from 'react'
import { getPlaces } from '../lib/api'
import PlaceCard from '../components/PlaceCard'
import SearchBar from '../components/SearchBar'
import Filters from '../components/Filters'
import type { Place } from '../types'

export default function Places() {
    const [q, setQ] = useState(''); const [city, setCity] = useState(''); const [category, setCategory] = useState('')
    const [data, setData] = useState<Place[]>([]); const [loading, setLoading] = useState(true)

    useEffect(() => {
        (async () => {
            setLoading(true)
            const res = await getPlaces({ q, city, category })
            setData(res); setLoading(false)
        })()
    }, [q, city, category])

    return (
        <div className="grid gap-4">
            <h1 className="text-xl font-bold text-fg-title">장소</h1>
            <SearchBar value={q} onChange={setQ} />
            <Filters city={city} onCity={setCity} category={category} onCategory={setCategory} />
            {loading ? <div className="h-28 w-full animate-pulse rounded bg-border-subtle" /> :
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {data.map(p => <PlaceCard key={p.id} place={p} />)}
                    {data.length === 0 && <div className="rounded-xl border border-border-subtle p-4 text-sm text-fg-muted">조건에 맞는 장소가 없습니다.</div>}
                </div>
            }
        </div>
    )
}
