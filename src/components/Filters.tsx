type Props = {
    city: string
    onCity: (v: string) => void
    category: string
    onCategory: (v: string) => void
}

export default function Filters({ city, onCity, category, onCategory }: Props) {
    return (
        <div className="grid gap-2 md:grid-cols-2">
            <select value={city} onChange={e => onCity(e.target.value)} className="rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm dark:bg-bg-muted">
                <option value="">모든 도시</option>
                <option>Ho Chi Minh</option><option>Hanoi</option><option>Da Nang</option>
            </select>
            <select value={category} onChange={e => onCategory(e.target.value)} className="rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm dark:bg-bg-muted">
                <option value="">모든 카테고리</option>
                <option>Lounge</option><option>Bar</option><option>Club</option><option>Karaoke</option>
            </select>
        </div>
    )
}
