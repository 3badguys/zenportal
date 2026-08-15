import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePost } from '../hooks/usePosts';
import { useComments } from '../hooks/useComments';
import MarkdownRenderer from '../components/MarkdownRenderer';
import CommentSection from '../components/CommentSection';

function Skeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-64 bg-gray-200 rounded-lg mb-6" />
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-full mb-4" />
      <div className="h-3 bg-gray-200 rounded w-1/4 mb-8" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>
    </div>
  );
}

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { post, loading, error } = usePost(slug!);
  const { groups, loading: commentsLoading, error: commentsError } = useComments(slug!);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    document.title = post ? `${post.title} — ZenPortal` : 'ZenPortal';
  }, [post]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors">Retry</button>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4 text-gray-300">404</div>
        <p className="text-gray-400">Post not found.</p>
      </div>
    );
  }

  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <div className={`max-w-3xl mx-auto px-4 py-8 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <article>
        {post.coverImage && (
          <img src={post.coverImage} alt={post.title} className="w-full h-64 object-cover rounded-lg mb-6" />
        )}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{post.title}</h1>
        {post.summary && <p className="text-gray-500 mb-4">{post.summary}</p>}
        <div className="flex items-center gap-3 mb-4">
          <time className="text-sm text-gray-400">{formattedDate ?? 'Not published'}</time>
          {(post.tags?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags!.map((t) => (
                <Link key={t.id} to={`/blog?tag=${t.slug}`} className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                  #{t.name}
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="mt-8">
          <MarkdownRenderer content={post.body} />
        </div>
      </article>

      {commentsError && (
        <div className="mt-12 border-t border-gray-200 pt-8 text-center text-gray-400">
          <p>Could not load comments.</p>
        </div>
      )}
      {!commentsLoading && !commentsError && (
        <CommentSection slug={slug!} groups={groups} />
      )}
    </div>
  );
}
