import { useState, useEffect, useCallback } from 'react';
import { postsApi, Post } from '../api/posts';

export function usePosts(page = 1, pageSize = 10) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await postsApi.getList(page, pageSize, signal);
      setPosts(res.data.items);
      setTotal(res.data.total);
    } catch (e: any) {
      if (e.name === 'AbortError' || e.code === 'ERR_CANCELED') return;
      setError(e.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(controller.signal);
    return () => controller.abort();
  }, [fetch]);

  // refetch without args - safe to pass directly to onClick  // refetch without args — safe to pass directly to onClick
  const refetch = () => fetch();

  return { posts, total, loading, error, refetch };
}

export function usePost(slug: string) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await postsApi.getBySlug(slug, controller.signal);
        setPost(res.data);
      } catch (e: any) {
        if (e.name === 'AbortError' || e.code === 'ERR_CANCELED') return;
        setError(e.message || 'Failed to load post');
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [slug]);

  return { post, loading, error };
}
