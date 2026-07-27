import { useState, useEffect } from 'react';
import { commentsApi, CommentGroup } from '../api/comments';

export function useComments(slug: string) {
  const [groups, setGroups] = useState<CommentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await commentsApi.getByPost(slug);
        setGroups(res.data);
      } catch (e: any) {
        setError(e.message || 'Failed to load comments');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  return { groups, loading, error, setGroups };
}
