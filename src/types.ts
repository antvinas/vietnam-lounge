export type Place = {
    id: string
    name: string
    city: 'Ho Chi Minh' | 'Hanoi' | 'Da Nang'
    category: 'Lounge' | 'Club' | 'Bar' | 'Karaoke'
    tags: string[]
    score: { clean: number; price: number; kindness: number; ambiance: number; commute: number }
    verified?: boolean
}

export type Review = {
    id: string
    placeId: string
    user: string
    rating: number
    text: string
    createdAt: string
}
