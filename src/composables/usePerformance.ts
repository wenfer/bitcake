import { ref, computed, onUnmounted } from 'vue';

/**
 * 高性能数据缓存管理
 * 用于缓存种子数据，减少重复计算
 */
export function useTorrentCache() {
  // 缓存计算结果
  const cache = new Map<string, any>();
  const cacheTimestamps = new Map<string, number>();
  const CACHE_TTL = 5000; // 缓存有效期 5 秒

  const getCached = <T>(key: string, compute: () => T): T => {
    const now = Date.now();
    const timestamp = cacheTimestamps.get(key);
    
    if (timestamp && now - timestamp < CACHE_TTL && cache.has(key)) {
      return cache.get(key) as T;
    }
    
    const result = compute();
    cache.set(key, result);
    cacheTimestamps.set(key, now);
    return result;
  };

  const invalidateCache = (key?: string) => {
    if (key) {
      cache.delete(key);
      cacheTimestamps.delete(key);
    } else {
      cache.clear();
      cacheTimestamps.clear();
    }
  };

  onUnmounted(() => {
    invalidateCache();
  });

  return {
    getCached,
    invalidateCache,
  };
}

/**
 * 请求防抖和节流
 */
export function useRequestControl() {
  const pendingRequests = new Map<string, Promise<any>>();
  const lastRequestTime = new Map<string, number>();

  /**
   * 防抖请求 - 相同 key 的请求在指定时间内只执行一次
   */
  const debounceRequest = <T>(
    key: string,
    requestFn: () => Promise<T>,
    delay: number = 300
  ): Promise<T> => {
    const existing = pendingRequests.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    const lastTime = lastRequestTime.get(key) || 0;
    const now = Date.now();
    
    if (now - lastTime < delay) {
      return Promise.resolve(null as T);
    }

    const promise = requestFn().finally(() => {
      pendingRequests.delete(key);
      lastRequestTime.set(key, Date.now());
    });

    pendingRequests.set(key, promise);
    return promise;
  };

  /**
   * 节流请求 - 限制请求频率
   */
  const throttleRequest = <T>(
    key: string,
    requestFn: () => Promise<T>,
    interval: number = 1000
  ): Promise<T | null> => {
    const lastTime = lastRequestTime.get(key) || 0;
    const now = Date.now();

    if (now - lastTime < interval) {
      return Promise.resolve(null);
    }

    lastRequestTime.set(key, now);
    return requestFn();
  };

  onUnmounted(() => {
    pendingRequests.clear();
    lastRequestTime.clear();
  });

  return {
    debounceRequest,
    throttleRequest,
  };
}

/**
 * 大数据集分页优化
 * 使用虚拟分页减少 DOM 渲染数量
 */
export function useVirtualPagination(
  items: any[],
  options: {
    pageSize?: number;
    overscan?: number;
  } = {}
) {
  const { pageSize = 50, overscan = 5 } = options;
  const currentPage = ref(1);
  const containerHeight = ref(0);
  const scrollTop = ref(0);

  const totalPages = computed(() => Math.ceil(items.length / pageSize));
  
  const visibleRange = computed(() => {
    const start = (currentPage.value - 1) * pageSize;
    const end = Math.min(start + pageSize, items.length);
    return { start, end };
  });

  const visibleItems = computed(() => {
    const { start, end } = visibleRange.value;
    return items.slice(start, end);
  });

  const goToPage = (page: number) => {
    currentPage.value = Math.max(1, Math.min(page, totalPages.value));
  };

  const nextPage = () => goToPage(currentPage.value + 1);
  const prevPage = () => goToPage(currentPage.value - 1);

  return {
    currentPage,
    totalPages,
    visibleItems,
    visibleRange,
    goToPage,
    nextPage,
    prevPage,
    containerHeight,
    scrollTop,
  };
}

/**
 * 内存使用监控
 */
export function useMemoryMonitor() {
  const memoryUsage = ref<{
    used: number;
    total: number;
    limit: number;
  } | null>(null);

  const updateMemoryUsage = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      memoryUsage.value = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
      };
    }
  };

  const formatMemory = (bytes: number): string => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const memoryWarning = computed(() => {
    if (!memoryUsage.value) return false;
    const { used, limit } = memoryUsage.value;
    return used / limit > 0.8; // 超过 80% 警告
  });

  return {
    memoryUsage,
    memoryWarning,
    updateMemoryUsage,
    formatMemory,
  };
}
