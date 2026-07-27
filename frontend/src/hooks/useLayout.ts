import { useState, useEffect, useCallback } from 'react';
import { layoutApi, LayoutData } from '../api/layout';

export function useLayout(pageSlug = 'home') {
  const [layout, setLayout] = useState<LayoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await layoutApi.get(pageSlug);
      setLayout(res.data);
    } catch (e: any) {
      setError(e.message || 'Failed to load layout');
    } finally {
      setLoading(false);
    }
  }, [pageSlug]);

  useEffect(() => { fetch(); }, [fetch]);

  return { layout, loading, error, refetch: fetch };
}
