// functions/src/routes/spots.router.ts
import { Router } from 'express';
import { db } from '../lib/firebase';

const router = Router();

/**
 * GET /api/spots
 * - q 파라미터가 있으면 이름 프리픽스 검색
 * - 없으면 최근 등록순(list) 일부 반환
 */
router.get('/', async (req, res) => {
  try {
    const q = (req.query.q as string | undefined)?.trim();
    if (q) {
      const qLower = q.toLowerCase();
      // nameLower 필드에 대해 prefix 검색 (인덱스 필요)
      const snap = await db
        .collection('spots')
        .where('nameLower', '>=', qLower)
        .where('nameLower', '<=', qLower + '\uf8ff')
        .limit(20)
        .get();

      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return res.json({ items });
    } else {
      const snap = await db
        .collection('spots')
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return res.json({ items });
    }
  } catch (err: any) {
    console.error('GET /spots error:', err);
    return res.status(500).json({ error: 'INTERNAL', message: err?.message });
  }
});

/**
 * GET /api/spots/search
 * - 프런트가 현재 이 경로를 호출하므로 동일 동작으로 제공
 * - 내부적으로 /api/spots?q= 로직과 동일
 */
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q as string | undefined)?.trim();
    if (!q) return res.json({ items: [] });

    const qLower = q.toLowerCase();
    const snap = await db
      .collection('spots')
      .where('nameLower', '>=', qLower)
      .where('nameLower', '<=', qLower + '\uf8ff')
      .limit(20)
      .get();

    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json({ items });
  } catch (err: any) {
    console.error('GET /spots/search error:', err);
    return res.status(500).json({ error: 'INTERNAL', message: err?.message });
  }
});

export default router;
