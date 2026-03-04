import { Redis } from '@upstash/redis';

const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

let _redis: Redis | null = null;
let _redisError: Error | null = null;

function getRedis(): Redis | null {
  if (_redisError) return null;

  if (!_redis) {
    try {
      const url = process.env.KV_REST_API_URL?.trim().replace(/[\r\n]+/g, '');
      const token = process.env.KV_REST_API_TOKEN?.trim().replace(/[\r\n]+/g, '');

      if (
        !url ||
        !token ||
        url === '""' ||
        url.includes('␍') ||
        url.includes('\r') ||
        url.includes('\n')
      ) {
        console.warn(
          'Redis configuration is missing or invalid. Authentication will work but without caching.'
        );
        _redisError = new Error('Redis not configured');
        return null;
      }

      _redis = new Redis({
        url,
        token,
      });
    } catch (error) {
      console.warn('Failed to initialize Redis:', error);
      _redisError = error as Error;
      return null;
    }
  }
  return _redis;
}

export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    if (isBuildTime) {
      return () => Promise.resolve(null);
    }
    const redisInstance = getRedis();
    if (!redisInstance) {
      return () => Promise.resolve(null);
    }
    return Reflect.get(redisInstance, prop);
  },
});

export const CACHE_TTL = {
  USER_SESSION: 3600,
  AUTH: 300,
  DASHBOARD: 300,
  EVENTS: 600,
  CLASSES: 300,
};
