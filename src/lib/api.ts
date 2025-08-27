import { PLACES, REVIEWS } from './mock'
import type { Place, Review } from '../types'

const K = {
    places: 'vl_places',
    reviews: 'vl_reviews',
    reports: 'vl_reports',
    bookmarks: 'vl_bookmarks',
} as const

function load<T>(key: string, fallback: T): T {
    const raw = localStorage.getItem(key)
    if (!raw) {
        localStorage.setItem(key, JSON.stringify(fallback))
        return fallback
    }
    try { return JSON.parse(raw) as T } catch { return fallback }
}
function save<T>(key: string, data: T) { localStorage.setItem(key, JSON.stringify(data)) }
const delay = (ms = 300) => new Promise(res => setTimeout(res, ms))

export async function getPlaces(params?: { q?: string; city?: string; category?: string }): Promise<Place[]> {
    await delay()
    const all = load<Place[]>(K.places, PLACES)
    if (!params) return all
    const { q, city, category } = params
    return all.filter(p => {
        const hitQ = q ? (p.name.toLowerCase().includes(q.toLowerCase()) || p.tags.some(t => t.includes(q))) : true
        const hitCity = city ? p.city === city : true
        const hitCat = category ? p.category === category : true
        return hitQ && hitCity && hitCat
    })
}

export async function getPlace(id: string) {
    await delay()
    return load<Place[]>(K.places, PLACES).find(p => p.id === id) || null
}

export async function getReviewsForPlace(placeId: string) {
    await delay()
    return load<Review[]>(K.reviews, REVIEWS).filter(r => r.placeId === placeId)
}

export async function addReview(data: Omit<Review, 'id' | 'createdAt'>) {
    await delay(200)
    const list = load<Review[]>(K.reviews, REVIEWS)
    const item: Review = { ...data, id: `r${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) }
    list.unshift(item)
    save(K.reviews, list)
    return item
}

export async function reportPlace(placeId: string, reason: string) {
    await delay(200)
    const list = load<{ id: string; placeId: string; reason: string; at: string }[]>(K.reports, [])
    list.push({ id: `rep${Date.now()}`, placeId, reason, at: new Date().toISOString() })
    save(K.reports, list)
    return true
}

export function getBookmarks(): Set<string> {
    return new Set(load<string[]>(K.bookmarks, []))
}
export function toggleBookmark(id: string): Set<string> {
    const set = getBookmarks()
    set.has(id) ? set.delete(id) : set.add(id)
    save(K.bookmarks, Array.from(set))
    return set
}
