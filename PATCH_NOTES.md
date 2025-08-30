# VN Lounge Patch (2025-08-30)

## Added / Modified Files
- `.env.example` – 신규 키 정리
- `firebase.json` – `/sitemap.xml` 함수 리라이트, 캐시 헤더
- `firestore.rules` – 역할/소유권/모더레이션 규칙 강화
- `firestore.indexes.json` – spots/reviews 인덱스
- `functions/package.json` – typesense/aws/sitemap 의존성 추가
- `functions/tsconfig.json`
- `functions/src/index.ts` – 함수 export 통합
- `functions/src/role.ts` – 커스텀 클레임 부여
- `functions/src/sitemap.ts` – 동적 사이트맵
- `functions/src/searchSync.ts` – Typesense 인덱싱 동기화 트리거
- `functions/src/imageUploadUrl.ts` – S3 서명 URL 발급
- `public/robots.txt` – /adult, /admin 차단
- `public/sw.js` – 내비게이션 네트워크 우선 + 자산 SWR
- `src/hooks/useAuth.tsx` – 클레임 강제 갱신
- `src/components/RequireRole.tsx` – 역할 가드 + 성인 게이트 함수
- `src/components/ui/StructuredData.tsx` – JSON-LD
- `src/components/ui/Consent.tsx` – 쿠키/광고 동의
- `src/components/Ad/BannerAd.tsx` – 동의 기반 lazy 로딩
- `src/components/ui/SafetyScoreWidget.tsx` – 기본 점수 로직
- `src/lib/seo.ts` – 타이틀/디스크립션 유틸
- `src/lib/image.ts` – S3 서명 업로드
- `src/lib/firebase.ts` – 초기화 보강
- `src/services/search.ts` – Typesense FE 클라이언트
- `src/modules/spots/SpotReviews.tsx` – 경량 비속어 필터 + 등록
- `src/pages/AdultGate.tsx` – 성인 확인 페이지
- `src/routes.tsx` – adult-gate 라우트 추가

## Required Secrets (Functions)
- `TYPESENSE_HOST`, `TYPESENSE_PORT`, `TYPESENSE_PROTOCOL`, `TYPESENSE_ADMIN_KEY`, `TYPESENSE_COLLECTION`
- `AWS_REGION`, `S3_BUCKET`, `CLOUDFRONT_URL`

Use: `firebase functions:secrets:set KEY_NAME` and reference via process.env at deploy time.

## Notes
- 기존 `public/sitemap.xml` 정적 파일이 있다면 유지해도 되지만, `firebase.json` 리라이트가 함수 응답을 우선시합니다.
- 프런트에서 Typesense는 **검색 전용 키**를 사용하세요.
- 성인/민감 경로는 `robots.txt`로 차단되지만, 확실한 비노출이 필요한 경우 페이지 `<meta name="robots" content="noindex">`도 병행하세요.
