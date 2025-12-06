import redisClient from "../config/redis.js";
export const getCache = async (key) => {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
};
export const setCache = async (key, value, expiry = 60) => {
    await redisClient.setEx(key, expiry, JSON.stringify(value));
};
export const deleteCache = async (key) => {
    await redisClient.del(key);
};
export const deleteCacheByPrefix = async (prefix) => {
    const keys = await redisClient.keys(`${prefix}*`);
    if (keys.length) {
        await redisClient.del(keys);
    }
};
export const cacheWrapper = async (key, fetchFunction, expiry = 60) => {
    const cachedData = await getCache(key);
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
//# sourceMappingURL=cache.js.map