// src/services/firestore.ts
import { collection, query, where, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import { db } from './firebaseClient';

export type SpotFilter = {
    city?: string;
    category?: string;
    priceLevel?: number;
    tags?: string[];
    sort?: 'rating' | 'new' | 'priceAsc' | 'priceDesc';
    cursor?: any;
};

export async function fetchSpots(f: SpotFilter, pageSize = 20) {
    let q = query(collection(db, 'spots'));
    if (f.city) q = query(q, where('city', '==', f.city));
    if (f.category) q = query(q, where('category', '==', f.category));
    if (f.priceLevel) q = query(q, where('priceLevel', '==', f.priceLevel));
    if (f.tags?.length) q = query(q, where('tags', 'array-contains-any', f.tags.slice(0, 10)));
    switch (f.sort) {
        case 'rating': q = query(q, orderBy('avgRating', 'desc'), orderBy('ratingsCount', 'desc')); break;
        case 'new': q = query(q, orderBy('createdAt', 'desc')); break;
        case 'priceAsc': q = query(q, orderBy('priceLevel', 'asc')); break;
        case 'priceDesc': q = query(q, orderBy('priceLevel', 'desc')); break;
        default: q = query(q, orderBy('avgRating', 'desc')); break;
    }
    if (f.cursor) q = query(q, startAfter(f.cursor));
    q = query(q, limit(pageSize));
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const nextCursor = snap.docs.at(-1);
    return { items, nextCursor };
}
