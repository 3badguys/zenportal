import { useState, useEffect, useCallback } from 'react';
import { mediaApi, Medium } from '../api/media';

export function useMedia(page = 1, pageSize = 50) {
  const [media, setMedia] = useState<Medium[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mediaApi.list(page, pageSize);
      setMedia(res.data.items);
      setTotal(res.data.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, pageSize]);

  useEffect(() => { fetch(); }, [fetch]);
  return { media, total, loading, refetch: fetch };
}
