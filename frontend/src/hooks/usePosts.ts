import { useState, useEffect, useCallback } from 'react';
import { postsApi, Post } from '../api/posts';

export function usePosts(page = 1, pageSize = 10) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await postsApi.getList(page, pageSize);
      setPosts(res.data.items);
      setTotal(res.data.total);
    } catch (e: any) {
      setError(e.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => { fetch(); }, [fetch]);

  return { posts, total, loading, error, refetch: fetch };
}

export function usePost(slug: string) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await postsApi.getBySlug(slug);
        setPost(res.data);
      } catch (e: any) {
        setError(e.message || 'Failed to load post');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  return { post, loading, error };
}
