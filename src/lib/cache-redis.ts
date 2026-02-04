import { redis } from "./redis";

export const getCachedData = async (key: string): Promise<string | null> => {
  try {
    return await redis.get(key);
  } catch (err) {
    console.warn("Redis GET failed", err);
    return null;
  }
};

export const saveToCacheWithExpiry = async (
  key: string,
  ttlSeconds: number,
  value: unknown
): Promise<void> => {
  try {
    await redis.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.warn("Redis SET failed", err);
  }
};

export const deleteCacheKeys = async (keys: string | string[]): Promise<void> => {
  try {
    await redis.del(keys as any);
  } catch (err) {
    console.warn("Redis DEL failed", err);
  }
};

export const deleteCacheByPattern = async (pattern: string): Promise<number> => {
  try {
    const keys: string[] = [];
    let cursor = "0";

    do {
      const result = await redis.scan(cursor, {
        MATCH: pattern,
        COUNT: 100,
      });
      cursor = result.cursor;
      keys.push(...result.keys);
    } while (cursor !== "0");

    if (keys.length === 0) {
      return 0;
    }

    await deleteCacheKeys(keys);
    return keys.length;
  } catch (err) {
    console.warn("Redis DEL_PATTERN failed", err);
    return 0;
  }
};

