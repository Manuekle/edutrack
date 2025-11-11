import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export const CACHE_TTL = {
  USER_SESSION: 3600, // 1 hour
  AUTH: 300, // 5 minutes
  DASHBOARD: 300, // 5 minutes
  EVENTS: 600, // 10 minutes
  CLASSES: 300, // 5 minutes
};
