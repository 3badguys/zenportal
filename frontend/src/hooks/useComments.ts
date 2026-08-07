import { useState, useEffect } from 'react';
import { commentsApi, CommentGroup } from '../api/comments';

export function useComments(slug: string) {
  const [groups, setGroups] = useState<CommentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await commentsApi.getByPost(slug, controller.signal);
        setGroups(res.data);
      } catch (e: any) {
        if (e.name === 'AbortError' || e.code === 'ERR_CANCELED') return;
        setError(e.message || 'Failed to load comments');
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [slug]);

  return { groups, loading, error, setGroups };
}
