import { useCallback, useRef, useState } from 'react';

interface PageResult<T> {
  content: T[];
  page: number;
  totalPages: number;
}

type LoadMode = 'initial' | 'refresh' | 'more';

const usePaginatedList = <T>(
  fetchPage: (page: number) => Promise<PageResult<T>>,
  getKey: (item: T) => string,
  onError: (err: unknown) => void,
) => {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const inFlight = useRef(false);

  const load = useCallback(async (pageToFetch: number, mode: LoadMode) => {
    if (inFlight.current) return;
    inFlight.current = true;
    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    if (mode === 'more') setLoadingMore(true);
    try {
      const data = await fetchPage(pageToFetch);
      setItems((prev) => {
        if (pageToFetch === 0) return data.content;
        const seen = new Set(prev.map(getKey));
        return [...prev, ...data.content.filter((item) => !seen.has(getKey(item)))];
      });
      setPage(data.page);
      setHasMore(data.page + 1 < data.totalPages);
      setLoaded(true);
    } catch (err) {
      onError(err);
    } finally {
      inFlight.current = false;
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [fetchPage, getKey, onError]);

  const loadInitial = useCallback(() => load(0, 'initial'), [load]);
  const refresh = useCallback(() => load(0, 'refresh'), [load]);
  const loadMore = useCallback(() => {
    if (loaded && hasMore) load(page + 1, 'more');
  }, [loaded, hasMore, page, load]);

  return { items, loaded, loading, refreshing, loadingMore, hasMore, loadInitial, refresh, loadMore };
};

export default usePaginatedList;
