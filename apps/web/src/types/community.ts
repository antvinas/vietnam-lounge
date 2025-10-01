export type CommunityCategory =
  | "여행이야기"
  | "동행모집"
  | "맛집후기"
  | "스파후기"
  | "Q&A"
  | "자유";

export interface AuthorInfo {
  uid: string | null;
  displayName: string;
  photoURL?: string | null;
  isAnonymous?: boolean;
}

export interface Post {
  id: string;
  category: CommunityCategory;
  title: string;
  content: string;
  region?: string;          // ex) "호치민", "하노이"
  tags?: string[];
  images?: string[];
  spotId?: string | null;

  author: AuthorInfo;

  upVotes: number;
  downVotes: number;
  hotScore: number;         // 정렬용
  commentCount: number;

  createdAt: number;        // epoch millis
  updatedAt: number;        // epoch millis
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  author: AuthorInfo;
  createdAt: number;
  updatedAt: number;
}

export interface ListPostsParams {
  category?: CommunityCategory | "all";
  region?: string | "all";
  sort?: "latest" | "hot";
  limit?: number;
  cursor?: number | null; // createdAt 기준 페이지네이션
}

export const COMMUNITY_COLLECTIONS = {
  posts: "community_posts",
  comments: "community_comments",
  votes: "community_votes",
} as const;
