import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Firestore 인스턴스 (admin 초기화가 index.ts에서 되어 있다면 재사용하거나 호출)
const db = admin.firestore();

/**
 * 리뷰가 작성/수정/삭제될 때마다 해당 스팟의 평점과 리뷰 수를 다시 계산합니다.
 * 감지 경로: {collectionId}/{spotId}/reviews/{reviewId}
 * -> spots 컬렉션과 adult_spots 컬렉션 모두 동작합니다.
 */
export const onReviewWrite = functions.firestore
  .document('{collectionId}/{spotId}/reviews/{reviewId}')
  .onWrite(async (change, context) => {
    const { collectionId, spotId } = context.params;

    // 1. 대상 컬렉션 필터링 (우리가 관리하는 스팟 컬렉션만 처리)
    if (collectionId !== 'spots' && collectionId !== 'adult_spots') {
      return null;
    }

    const spotRef = db.collection(collectionId).doc(spotId);

    try {
      // 2. 해당 스팟의 모든 리뷰 가져오기
      // (리뷰 수가 수천 개 이상으로 매우 많아지면 별도의 집계 방식(Distributed Counter)이 필요하지만, 초기에는 이 방식이 가장 정확합니다.)
      const reviewsSnapshot = await spotRef.collection('reviews').get();

      // 3. 리뷰가 하나도 없는 경우 (모두 삭제된 경우) 초기화
      if (reviewsSnapshot.empty) {
        return spotRef.update({
          rating: 0,
          reviewCount: 0
        });
      }

      // 4. 평점 평균 및 개수 계산
      const reviews = reviewsSnapshot.docs;
      const reviewCount = reviews.length;

      const totalRating = reviews.reduce((acc, doc) => {
        const data = doc.data();
        const r = Number(data.rating);
        // 평점이 없거나 숫자가 아닌 경우 0 처리하여 계산 오류 방지
        return acc + (isNaN(r) ? 0 : r);
      }, 0);

      // 소수점 첫째 자리까지 반올림 (예: 4.5)
      const averageRating = Math.round((totalRating / reviewCount) * 10) / 10;

      console.log(`[ReviewTrigger] Updating ${collectionId}/${spotId}: rating=${averageRating}, count=${reviewCount}`);

      // 5. 부모 스팟 문서 업데이트
      return spotRef.update({
        rating: averageRating,
        reviewCount: reviewCount
      });

    } catch (error) {
      console.error(`[ReviewTrigger] Error updating spot ${spotId}:`, error);
      return null;
    }
  });