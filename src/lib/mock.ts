import type { Place, Review } from '../types'

export const PLACES: Place[] = [
    {
        id: 'p1',
        name: 'Lounge Saigon One',
        city: 'Ho Chi Minh',
        category: 'Lounge',
        tags: ['비흡연석', '카드결제', '라이브'],
        score: { clean: 4.2, price: 4.0, kindness: 4.5, ambiance: 4.3, commute: 3.9 },
        verified: true,
    },
    {
        id: 'p2',
        name: 'Hanoi Night Bar',
        city: 'Hanoi',
        category: 'Bar',
        tags: ['해피아워', '분위기좋음'],
        score: { clean: 4.0, price: 4.1, kindness: 4.2, ambiance: 4.6, commute: 3.6 },
    },
    {
        id: 'p3',
        name: 'Da Nang Beach Club',
        city: 'Da Nang',
        category: 'Club',
        tags: ['라이브DJ', '단체석'],
        score: { clean: 3.9, price: 3.8, kindness: 4.0, ambiance: 4.7, commute: 4.1 },
    },
]

export const REVIEWS: Review[] = [
    { id: 'r1', placeId: 'p1', user: '@wanderer', rating: 4.5, text: '가격 투명, 응대 친절.', createdAt: '2025-08-25' },
    { id: 'r2', placeId: 'p2', user: '@sunny', rating: 4.2, text: '칵테일 맛있고 분위기 굿!', createdAt: '2025-08-24' },
    { id: 'r3', placeId: 'p1', user: '@nightowl', rating: 4.3, text: '라이브 공연이 특히 좋음.', createdAt: '2025-08-23' },
]
