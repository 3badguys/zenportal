import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePosts } from '../hooks/usePosts';
import { tagsApi, Tag } from '../api/tags';
import PostCard from '../components/PostCard';
import SkeletonCard from '../components/Skeleton';
import Pagination from '../components/Pagination';

export default function BlogPage() {
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTag = searchParams.get('tag');
  const [hotTags, setHotTags] = useState<Tag[]>([]);
  const { posts, total, loading, error, refetch } = usePosts(page, 10, selectedTag ?? undefined);
  const totalPages = Math.ceil(total / 10);
  const [visible, setVisible] = useState(false);

  useEffect(() => { document.title = 'Blog — ZenPortal'; }, []);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => { tagsApi.publicList().then((res) => setHotTags(res.data)).catch(() => {}); }, []);

  useEffect(() => { setPage(1); }, [selectedTag]);

  const toggleTag = (slug: string) => {
    setPage(1);
    if (selectedTag === slug) setSearchParams({});
    else setSearchParams({ tag: slug });
  };

  const clearTag = () => setSearchParams({});

  return (
    <div className={`max-w-3xl mx-auto px-4 py-8 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      {hotTags.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">🏷️ Popular Tags</h2>
          <div className="flex flex-wrap gap-2">
            {hotTags.map((t) => (
              <button
                key={t.id}
                onClick={() => toggleTag(t.slug)}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  selectedTag === t.slug
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {t.name} ({t.postCount ?? 0})
              </button>
            ))}
          </div>
          {selectedTag && (
            <button onClick={clearTag} className="mt-2 text-xs text-gray-400 hover:text-gray-600">
              ✕ Clear tag filter
            </button>
          )}
        </div>
      )}

      {error ? (
        <div className="text-center py-20">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={refetch} className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors">Retry</button>
        </div>
      ) : loading ? (
        <div className="grid gap-4"><SkeletonCard variant="card" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-4 text-gray-300">---</div>
          <p className="text-gray-400 mb-2">{selectedTag ? 'No posts with this tag.' : 'No posts yet.'}</p>
          <p className="text-sm text-gray-300">Check back soon for new content.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {posts.map((p) => <PostCard key={p.id} post={p} onTagClick={toggleTag} />)}
        </div>
      )}
      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPage={setPage} variant="full" />}
    </div>
  );
}
