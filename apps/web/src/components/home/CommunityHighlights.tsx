import React from 'react';
import { FaComments, FaArrowRight, FaHeart } from 'react-icons/fa';

// Expanded the Post interface to include engagement data.
interface Post {
  id: number;
  title: string;
  author: string;
  avatarUrl: string;
  comments: number;
  likes: number;
}

interface CommunityHighlightsProps {
  posts: Post[];
}

// The PostPreviewCard is updated to show comment and like counts, enhancing the sense of activity.
const PostPreviewCard = ({ post }: { post: Post }) => (
  <div className="bg-surface p-4 rounded-xl shadow-subtle motion-safe:transition-transform-shadow motion-safe:duration-240 motion-safe:hover:scale-102 motion-safe:hover:shadow-lifted flex flex-col justify-between h-full">
    <div className="flex items-start space-x-4">
        <img 
          src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${post.author}`}
          alt={post.author} 
          className="w-10 h-10 rounded-full bg-background flex-shrink-0"
        />
        <div className="flex-1">
          <h4 className="font-semibold text-text-main leading-snug">{post.title}</h4>
        </div>
    </div>
    <div className="flex items-center justify-between mt-4 text-sm text-text-secondary">
        <p className='truncate'>by {post.author}</p>
        <div className="flex items-center space-x-3 flex-shrink-0">
            <span className="flex items-center space-x-1">
                <FaHeart />
                <span>{post.likes}</span>
            </span>
            <span className="flex items-center space-x-1">
                <FaComments />
                <span>{post.comments}</span>
            </span>
        </div>
    </div>
  </div>
);

const CommunityHighlights: React.FC<CommunityHighlightsProps> = ({ posts }) => {
  return (
    <section className="bg-background py-16">
        <div className="container mx-auto px-4">
            <div className="text-center mb-10">
                <h2 className="text-h2 text-text-main flex items-center justify-center gap-3">
                    <FaComments /> Latest from Community
                </h2>
                <p className="text-body text-text-secondary mt-2 max-w-2xl mx-auto">실시간으로 올라오는 생생한 현지 소식을 확인하세요.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {posts.map(post => (
                  <PostPreviewCard key={post.id} post={post} />
                ))}
            </div>
            <div className="text-center">
                <button className="bg-surface hover:bg-elevated text-text-main font-bold py-3 px-8 rounded-full motion-safe:transition-all motion-safe:duration-240 motion-safe:transform motion-safe:hover:scale-105 shadow-subtle hover:shadow-lifted flex items-center gap-2 mx-auto">
                    라운지 더보기 <FaArrowRight />
                </button>
            </div>
        </div>
    </section>
  );
};

export default CommunityHighlights;
