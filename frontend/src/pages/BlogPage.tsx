import { useEffect, useState } from 'react';
import { usePosts } from '../hooks/usePosts';
import PostCard from '../components/PostCard';
import SkeletonCard from '../components/Skeleton';
import Pagination from '../components/Pagination';

export default function BlogPage() {
  const [page, setPage] = useState(1);
  const { posts, total, loading, error, refetch } = usePosts(page, 10);
  const totalPages = Math.ceil(total / 10);
  const [visible, setVisible] = useState(false);

  useEffect(() => { document.title = 'Blog — ZenPortal'; }, []);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (loading) return <SkeletonCard variant="card" />;

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={refetch} className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors">Retry</button>
      </div>
    );
  }

  return (
    <div className={`max-w-3xl mx-auto px-4 py-8 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <h1 className="text-2xl font-bold mb-6">Blog</h1>
      {posts.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-4 text-gray-300">---</div>
          <p className="text-gray-400 mb-2">No posts yet.</p>
          <p className="text-sm text-gray-300">Check back soon for new content.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {posts.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      )}
      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPage={setPage} variant="full" />}
    </div>
  );
}
