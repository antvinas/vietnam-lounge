// functions/src/triggers/cleanup.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * 스팟(spots/adult_spots) 문서가 삭제되면,
 * 그 아래에 달린 'reviews' 하위 컬렉션의 모든 문서도 자동으로 삭제합니다.
 */
export const onSpotDelete = functions.firestore
  .document('{collectionId}/{spotId}')
  .onDelete(async (snap, context) => {
    const { collectionId, spotId } = context.params;

    // spots 또는 adult_spots 컬렉션만 대상
    if (collectionId !== 'spots' && collectionId !== 'adult_spots') {
      return null;
    }

    console.log(`🗑️ Deleting reviews for deleted spot: ${collectionId}/${spotId}`);

    // 하위 컬렉션 'reviews' 조회
    const reviewsRef = db.collection(collectionId).doc(spotId).collection('reviews');
    
    try {
      // 배치 삭제 (Batch Delete) 처리
      // 주의: 리뷰가 500개 이상이면 여러 번 나누어 지워야 하지만, 초기엔 이 방식으로 충분합니다.
      const snapshot = await reviewsRef.get();
      
      if (snapshot.empty) {
        console.log('No reviews found to delete.');
        return null;
      }

      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`✅ Successfully deleted ${snapshot.size} reviews.`);
      return true;

    } catch (error) {
      console.error(`❌ Error deleting sub-collection reviews:`, error);
      return null;
    }
  });