// apps/web/src/api/community.ts
import { api } from "../lib/api";

// =============================
// Data Types
// =============================
export interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  avatar?: string;
  category: string;
  region?: string;
  tags?: string[];
  createdAt?: string | { seconds: number };
  updatedAt?: string;
  likes: number;
  commentsCount: number;
  viewCount: number;
  upVotes?: number;
  downVotes?: number;
  hotScore?: number;
  // 추가 필드
  isNotice?: boolean;
  isPinned?: boolean;
  thumbnailUrl?: string;
  authorName?: string;
  views?: number; // 과거 호환
  imageUrl?: string;
}

export interface Comment {
  id: string;
  postId: string;
  author?: string;
  authorId?: string;
  avatar?: string;
  content: string;
  createdAt?: string | { seconds: number };
  likeCount?: number;
  timestamp?: string;
  parentId?: string;
  guestName?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface PostFormData {
  title: string;
  content: string;
  category: string;
  region?: string;
  tags?: string[];
  segment: "general" | "adult";
}

export interface ListPostsParams {
  category?: string;
  region?: string;
  sort?: "latest" | "hot" | "comments" | "views";
  cursor?: string | null;
  limit?: number;
  segment: "general" | "adult";
}

// =============================
// API Functions
// =============================

// 게시글 목록 조회
export const getPosts = async (params: ListPostsParams): Promise<{
  items: Post[];
  nextCursor: string | null;
}> => {
  const { segment, category, region, sort, cursor, limit } = params;
  const queryParams: Record<string, any> = { sort, cursor, limit };

  if (category && category !== "all" && category !== "전체")
    queryParams.category = category;
  if (region && region !== "all" && region !== "전체 지역")
    queryParams.region = region;

  const response = await api.get(`/community/posts/${segment}`, {
    params: queryParams,
  });
  return response.data;
};

// 게시글 단건 조회
export const getPostById = async (
  id: string,
  segment: string
): Promise<Post | null> => {
  try {
    const response = await api.get(`/community/posts/${segment}/${id}`);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 404) return null;
    throw error;
  }
};

// 댓글 조회
export const getCommentsByPostId = async (
  postId: string,
  segment: string
): Promise<Comment[]> => {
  const response = await api.get(
    `/community/posts/${segment}/${postId}/comments`
  );
  return response.data;
};

// 게시글 작성 (게스트도 가능)
export const createPost = async (
  postData: PostFormData & { guestName?: string; guestPw?: string }
): Promise<Post> => {
  const response = await api.post("/community/posts", {
    ...postData,
    segment: postData.segment,
  });
  return response.data;
};

// 게시글 수정 (게스트는 비밀번호 필요)
export const updatePost = async (
  postId: string,
  postData: Partial<PostFormData> & { guestName?: string; guestPw?: string }
): Promise<Post> => {
  const response = await api.put(`/community/posts/${postId}`, postData);
  return response.data;
};

// 게시글 삭제 (게스트는 비밀번호 필요)
export const deletePost = async (
  postId: string,
  segment: string,
  guestName?: string,
  guestPw?: string
): Promise<{ success: boolean }> => {
  const response = await api.delete(`/community/posts/${segment}/${postId}`, {
    data: { guestName, guestPw },
  });
  return response.data;
};

// 댓글 작성 (게스트/대댓글 포함)
export const createComment = async (
  postId: string,
  content: string,
  segment: string,
  parentId?: string,
  guestName?: string,
  guestPw?: string
): Promise<Comment> => {
  const response = await api.post(
    `/community/posts/${segment}/${postId}/comments`,
    { content, parentId, guestName, guestPw }
  );
  return response.data;
};

// 댓글 수정 (게스트는 비밀번호 필요)
export const updateComment = async (
  postId: string,
  commentId: string,
  segment: string,
  content: string,
  guestName?: string,
  guestPw?: string
): Promise<Comment> => {
  const response = await api.put(
    `/community/posts/${segment}/${postId}/comments/${commentId}`,
    { content, guestName, guestPw }
  );
  return response.data;
};

// 댓글 삭제 (게스트는 비밀번호 필요)
export const deleteComment = async (
  postId: string,
  commentId: string,
  segment: string,
  guestName?: string,
  guestPw?: string
): Promise<{ success: boolean }> => {
  const response = await api.delete(
    `/community/posts/${segment}/${postId}/comments/${commentId}`,
    { data: { guestName, guestPw } }
  );
  return response.data;
};

// 카테고리 목록 조회
export const getCategories = async (segment: string): Promise<Category[]> => {
  const response = await api.get(`/community/categories/${segment}`);
  return response.data;
};

// 게시글 좋아요
export const updatePostLike = async (
  postId: string,
  segment: string
): Promise<{ likes: number }> => {
  const response = await api.post(
    `/community/posts/${segment}/${postId}/like`
  );
  return response.data;
};

// 게시글 투표 (추천/비추천)
export const votePost = async (
  postId: string,
  segment: string,
  value: 1 | -1
): Promise<{ upVotes: number; downVotes: number; hotScore: number }> => {
  const response = await api.post(
    `/community/posts/${segment}/${postId}/vote`,
    { value }
  );
  return response.data;
};

// ✅ 게시글 조회수 증가
export const increaseViewCount = async (
  postId: string,
  segment: string
): Promise<{ viewCount: number }> => {
  const response = await api.post(
    `/community/posts/${segment}/${postId}/view`
  );
  return response.data;
};
