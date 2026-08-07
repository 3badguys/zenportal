import { useState, useEffect, useCallback } from 'react';
import { layoutApi, LayoutData } from '../api/layout';

export function useLayout(pageSlug = 'home') {
  const [layout, setLayout] = useState<LayoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await layoutApi.get(pageSlug, signal);
      setLayout(res.data);
    } catch (e: any) {
      if (e.name === 'AbortError' || e.code === 'ERR_CANCELED') return;
      setError(e.message || 'Failed to load layout');
    } finally {
      setLoading(false);
    }
  }, [pageSlug]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(controller.signal);
    return () => controller.abort();
  }, [fetch]);

  // refetch without args - safe to pass directly to onClick  // refetch without args — safe to pass directly to onClick
  const refetch = () => fetch();

  return { layout, loading, error, refetch };
}
