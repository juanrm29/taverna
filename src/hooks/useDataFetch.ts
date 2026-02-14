import { useState, useEffect, useCallback, useRef } from 'react';

interface UseDataFetchOptions<T> {
  /** Initial data value */
  initialData?: T;
  /** Whether to fetch immediately on mount */
  immediate?: boolean;
  /** Dependencies that trigger refetch */
  deps?: any[];
  /** Transform the response data */
  transform?: (data: T) => T;
}

interface UseDataFetchReturn<T> {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | undefined>>;
}

/**
 * Generic data fetching hook with loading, error, and refetch support.
 * 
 * @example
 * const { data, loading, error, refetch } = useDataFetch(
 *   () => api.getCampaigns(),
 *   { initialData: [], immediate: true }
 * );
 */
export function useDataFetch<T>(
  fetcher: () => Promise<T>,
  options: UseDataFetchOptions<T> = {}
): UseDataFetchReturn<T> {
  const { initialData, immediate = true, deps = [], transform } = options;
  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await fetcher();
      const result = transform ? transform(raw) : raw;
      if (mountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher, transform]);

  useEffect(() => {
    mountedRef.current = true;
    if (immediate) {
      refetch();
    }
    return () => {
      mountedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch, setData };
}

/**
 * Hook that provides debounced value.
 * Useful for search inputs, API calls that shouldn't fire on every keystroke.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for keyboard shortcuts.
 */
export function useHotkey(key: string, callback: () => void, deps: any[] = []) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.includes('Mac');
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (key.startsWith('mod+')) {
        const targetKey = key.replace('mod+', '').toLowerCase();
        if (mod && e.key.toLowerCase() === targetKey) {
          e.preventDefault();
          callback();
        }
      } else if (e.key.toLowerCase() === key.toLowerCase() && !e.metaKey && !e.ctrlKey) {
        // Only fire if no input is focused
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) return;
        callback();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Hook to detect if component is in viewport (Intersection Observer).
 */
export function useInView(ref: React.RefObject<Element | null>, options?: IntersectionObserverInit) {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
    }, { threshold: 0.1, ...options });

    observer.observe(element);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);

  return isInView;
}
