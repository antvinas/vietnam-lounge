# React Query 캐싱 전략

커뮤니티(라운지) 기능에서 사용하는 **React Query 캐싱 전략**을 정리한다.  
이 문서는 게시글 / 댓글 / 좋아요 / 투표 액션에 따라 어떤 queryKey를 사용하고, 어떤 시점에 invalidate 해야 하는지를 설명한다.

---

## 📌 Query Keys

| Key 형태 | 설명 |
|----------|------|
| `["posts", category, region, sort, segment]` | 게시글 목록 (카테고리, 지역, 정렬, Explorer/Nightlife 모드별) |
| `["post", postId, segment]` | 특정 게시글 상세 |
| `["comments", postId, segment]` | 특정 게시글의 댓글 |
| `["categories", segment]` | 카테고리 목록 (Explorer/Nightlife 모드별) |

---

## 📌 액션별 캐시 처리

### 1. 새 글 작성 (`createPost`)
- 성공 시:
  - `invalidateQueries(["posts", ...])` → 게시글 목록 갱신
- 리다이렉트:
  - Explorer → `/community`
  - Nightlife → `/nightlife/community`

---

### 2. 글 수정 (`updatePost`)
- 성공 시:
  - `invalidateQueries(["posts", ...])`
  - `invalidateQueries(["post", postId, ...])` → 상세 화면 갱신
- 리다이렉트:
  - 해당 게시글 상세 페이지

---

### 3. 댓글 작성 (`createComment`)
- 성공 시:
  - `invalidateQueries(["comments", postId, ...])`
  - `invalidateQueries(["post", postId, ...])` → `commentsCount` 반영

---

### 4. 좋아요 토글 (`updatePostLike`)
- 성공 시:
  - `setQueryData(["post", postId, ...])` → 낙관적 업데이트
  - 실패 시 rollback 필요할 수 있음

---

### 5. 투표 (`votePost`)
- 성공 시:
  - `invalidateQueries(["post", postId, ...])` → upVotes/downVotes 최신 반영

---

## 📌 캐싱 정책

- **Stale Time**: 대부분의 쿼리는 `staleTime: 30초` → 짧은 주기 새로고침 허용
- **Retry**: 네트워크 에러 시 2회 재시도
- **GC Time**: `gcTime: 5분` (사용하지 않는 쿼리 5분 뒤 캐시 제거)

---

✅ 이 전략으로 Explorer/Nightlife 모드별 커뮤니티 데이터가 안정적으로 동기화된다.
