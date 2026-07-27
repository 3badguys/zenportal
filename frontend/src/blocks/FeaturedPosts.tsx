import PostCard from '../components/PostCard';
import { Post } from '../api/posts';

interface FeaturedPostsProps { title?: string; maxCount?: number; postIds?: string[]; posts?: Partial<Post>[]; }

export default function FeaturedPosts({ title, posts }: FeaturedPostsProps) {
  if (!posts || posts.length === 0) return null;
  return (
    <div className="py-4">
      {title && <h2 className="text-xl font-semibold mb-4 text-gray-900">{title}</h2>}
      <div className="grid gap-4 sm:grid-cols-2">
        {posts.slice(0, 6).map((p) => (
          <PostCard key={p.id} post={p as Post} />
        ))}
      </div>
    </div>
  );
}
export const blockType = 'FeaturedPosts';
