import { Link } from 'react-router-dom';
import { Post } from '../api/posts';

export default function PostCard({ post, onTagClick }: { post: Post; onTagClick?: (slug: string) => void }) {
  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : null;

  return (
    <Link to={`/posts/${post.slug}`}
      className="block p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition-all duration-200">
      {post.coverImage && (
        <img src={post.coverImage} alt={post.title} className="w-full h-40 object-cover rounded mb-3" />
      )}
      <h2 className="text-lg font-semibold text-gray-900 mb-1">{post.title}</h2>
      {post.summary && <p className="text-sm text-gray-500 mb-2 line-clamp-2">{post.summary}</p>}
      <div className="flex items-center justify-between">
        <time className="text-xs text-gray-400">{formattedDate ?? 'Not published'}</time>
        {(post.tags?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags!.map((t) => (
              <button
                key={t.id}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTagClick?.(t.slug); }}
                className={`text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors ${onTagClick ? 'cursor-pointer' : 'cursor-default'}`}
              >
                #{t.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
