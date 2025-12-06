export declare const getCache: <T>(key: string) => Promise<T | null>;
export declare const setCache: (key: string, value: any, expiry?: number) => Promise<void>;
export declare const deleteCache: (key: string) => Promise<void>;
export declare const deleteCacheByPrefix: (prefix: string) => Promise<void>;
export declare const cacheWrapper: <T>(key: string, fetchFunction: () => Promise<T | null>, expiry?: number) => Promise<T | null>;
//# sourceMappingURL=cache.d.ts.map