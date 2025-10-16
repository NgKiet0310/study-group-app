import redisClient from "../config/redis.js";

export const getCache = async <T>(key: string): Promise<T | null> => {
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

export const setCache = async (key: string, value: any, expiry = 60): Promise<void> => {
  await redisClient.setEx(key, expiry, JSON.stringify(value));
};

export const deleteCache = async (key: string): Promise<void> => {
  await redisClient.del(key);
};

export const deleteCacheByPrefix = async (prefix: string): Promise<void> => {
  const keys = await redisClient.keys(`${prefix}*`);
  if (keys.length) {
    await redisClient.del(keys);
  }
};


export const cacheWrapper = async <T>(
  key: string,
  fetchFunction: () => Promise<T | null>,
  expiry = 60
): Promise<T | null> => {
  const cachedData = await getCache<T>(key);

  if (cachedData !== null) {
    return cachedData;
  }

  const data = await fetchFunction();

  if (data === null) {
    await deleteCache(key);
    return null;
  }
  await setCache(key, data, expiry);
  return data;
};


