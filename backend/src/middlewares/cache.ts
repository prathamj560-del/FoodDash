import { Request, Response, NextFunction } from 'express';
import redisClient from '../utils/redis';

interface CacheOptions {
    expirySeconds?: number;
    keyPrefix?: string;
}

/**
 * Middleware to cache API responses in Redis
 * Usage: router.get('/endpoint', cacheMiddleware({ expirySeconds: 300 }), controller)
 */
export const cacheMiddleware = (options: CacheOptions = {}) => {
    const { expirySeconds = 300, keyPrefix = 'api' } = options;

    return async (req: Request, res: Response, next: NextFunction) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        try {
            // Create cache key from URL and query parameters
            const cacheKey = `${keyPrefix}:${req.originalUrl}`;

            // Try to get cached data
            const cachedData = await redisClient.get(cacheKey);

            if (cachedData) {
                console.log(`✅ Cache HIT: ${cacheKey}`);
                return res.json(cachedData);
            }

            console.log(`❌ Cache MISS: ${cacheKey}`);

            // Store original res.json function
            const originalJson = res.json.bind(res);

            // Override res.json to cache the response
            res.json = function (data: any) {
                // Cache the response data
                redisClient.set(cacheKey, data, expirySeconds).catch(err => {
                    console.error('Error caching response:', err);
                });

                // Call original json function
                return originalJson(data);
            };

            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            // If Redis fails, continue without caching
            next();
        }
    };
};

/**
 * Helper function to invalidate cache for a specific pattern
 * Usage: await invalidateCache('api:/api/shop/*')
 */
export const invalidateCache = async (pattern: string): Promise<void> => {
    try {
        await redisClient.delPattern(pattern);
        console.log(`🗑️  Cache invalidated: ${pattern}`);
    } catch (error) {
        console.error('Error invalidating cache:', error);
    }
};

/**
 * Helper function to invalidate cache for a specific key
 */
export const invalidateCacheKey = async (key: string): Promise<void> => {
    try {
        await redisClient.del(key);
        console.log(`🗑️  Cache key deleted: ${key}`);
    } catch (error) {
        console.error('Error deleting cache key:', error);
    }
};
