import { getCachedData, saveToCacheWithExpiry, deleteCacheByPattern } from "./cache-redis";
import { CACHE_TTL } from "./cache-constants";

export const cachedQuery = async <T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> => {
  try {
    const cached = await getCachedData(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }

    const value = await fetchFn();
    await saveToCacheWithExpiry(key, ttlSeconds, value);
    return value;
  } catch (err) {
    console.warn("Cached query failed, fetching fresh data", err);
    return await fetchFn();
  }
};

export const cache = {
  worklogs: <T>(key: string, fn: () => Promise<T>) =>
    cachedQuery(key, CACHE_TTL.WORKLOGS, fn),
  
  projects: <T>(key: string, fn: () => Promise<T>) =>
    cachedQuery(key, CACHE_TTL.PROJECTS, fn),
  
  users: <T>(key: string, fn: () => Promise<T>) =>
    cachedQuery(key, CACHE_TTL.USERS, fn),
  
  userProfile: <T>(key: string, fn: () => Promise<T>) =>
    cachedQuery(key, CACHE_TTL.USER_PROFILE, fn),
  
  auth: <T>(key: string, fn: () => Promise<T>) =>
    cachedQuery(key, CACHE_TTL.AUTH, fn),
  
  invalidate: async (...patterns: string[]) => {
    await Promise.all(patterns.map(pattern => deleteCacheByPattern(pattern)));
  },
};

export { CacheNamespace, CACHE_TTL } from "./cache-constants";

export {
  getCachedData,
  saveToCacheWithExpiry,
  deleteCacheByPattern
} from "./cache-redis";

export { makeSimpleKey, CacheKeys } from "./cache-keys";
