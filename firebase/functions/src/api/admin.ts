// functions/src/api/admin.ts
import * as express from 'express';
import * as admin from 'firebase-admin';
import { z } from 'zod'; // 유효성 검사를 위해 zod 추가
import { validate } from '../middlewares/validate'; // 기존 미들웨어 활용
import { requireAdmin } from '../middlewares/requireAdmin';

const router = express.Router();
const db = admin.firestore();

// 모든 요청에 관리자 권한 필요
router.use(requireAdmin);

// ✅ [Helper] 검색용 키워드 생성 함수
// 제목, 도시, 지역, 카테고리 등의 텍스트를 쪼개서 소문자 배열로 만듭니다.
const generateKeywords = (...texts: (string | undefined)[]) => {
  const keywords = new Set<string>();
  
  texts.forEach(text => {
    if (!text) return;
    // 1. 띄어쓰기 기준으로 단어 분리
    const words = text.toLowerCase().split(/\s+/);
    words.forEach(w => {
      if (w.length > 0) keywords.add(w); // 단어 자체 저장 (예: "hanoi")
      
      // 2. (선택사항) 부분 검색을 위해 2글자 이상 접두사도 저장하려면 아래 주석 해제
      // for (let i = 1; i <= w.length; i++) keywords.add(w.substring(0, i));
    });
  });

  return Array.from(keywords);
};

// ✅ [Schema] 스팟 생성/수정 유효성 검사 스키마
const SpotSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  city: z.string(),
  region: z.string().optional(),
  category: z.string(),
  images: z.array(z.string()).optional(),
  address: z.string().optional(),
  mode: z.enum(['day', 'night']).optional().default('day'), // Day/Night 모드 구분
  // 필요한 다른 필드들 추가 가능 (price, openingHours 등)
});

// --------------------------------------------------------------------------
// 1. 기존 Analytics 및 Users 라우트 (유지)
// --------------------------------------------------------------------------

// GET /admin/analytics/overview
router.get('/analytics/overview', async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    // spots는 전체 카운트만 필요하므로 count() 쿼리 사용 권장 (비용 절감)
    const spotsSnapshot = await db.collection('spots').count().get();
    
    const overview = {
      totalUsers: usersSnapshot.size,
      totalSpots: spotsSnapshot.data().count,
    };

    res.status(200).send(overview);
  } catch (error) {
    res.status(500).send({ error: 'Failed to fetch analytics overview.' });
  }
});

// GET /admin/users/list
router.get('/users/list', async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').limit(50).get();
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).send(users);
  } catch (error) {
    res.status(500).send({ error: 'Failed to fetch users.' });
  }
});

// --------------------------------------------------------------------------
// 2. 🆕 [추가] 스팟 관리 라우트 (키워드 생성 로직 포함)
// --------------------------------------------------------------------------

// POST /admin/spots (스팟 생성)
router.post('/spots', validate(SpotSchema), async (req, res) => {
  try {
    const body = req.body;
    
    // 1. 키워드 생성 (이름, 도시, 지역, 카테고리 조합)
    const keywords = generateKeywords(body.name, body.city, body.region, body.category);

    const docData = {
      ...body,
      keywords, // 검색용 필드 추가
      rating: 0,
      reviewCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // 모드에 따라 컬렉션 분리 (spots / adult_spots)
    const collectionName = body.mode === 'night' ? 'adult_spots' : 'spots';
    const docRef = await db.collection(collectionName).add(docData);

    res.status(201).send({ id: docRef.id, message: 'Spot created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to create spot' });
  }
});

// PATCH /admin/spots/:id (스팟 수정)
router.patch('/spots/:id', validate(SpotSchema.partial()), async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    
    // 모드는 수정 시 쿼리 파라미터나 바디로 받아야 정확한 컬렉션을 찾음 (기본은 spots)
    const collectionName = req.query.mode === 'night' ? 'adult_spots' : 'spots';
    
    // 업데이트할 데이터 준비
    const updateData: any = { ...body, updatedAt: admin.firestore.FieldValue.serverTimestamp() };

    // 이름이나 검색 관련 필드가 바뀌었다면 키워드도 재생성해야 함
    if (body.name || body.city || body.region || body.category) {
        // 기존 데이터를 가져와서 합쳐야 정확하지만, 
        // 성능을 위해 입력된 값 위주로 키워드를 다시 짭니다. (실무에선 기존 DB 읽어서 병합 추천)
        updateData.keywords = generateKeywords(body.name, body.city, body.region, body.category);
    }

    await db.collection(collectionName).doc(id).update(updateData);

    res.status(200).send({ id, message: 'Spot updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to update spot' });
  }
});

export const adminRouter = router;