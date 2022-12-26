import { Redis } from '@upstash/redis';

// Environment variables validation function
const validateEnvironment = () => {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    throw new Error('Redis environment variables are not set');
  }
};

// Create Redis client instance
const createRedisClient = (): Redis => {
  validateEnvironment();
  return new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  });
};

// Lazy-initialized Redis client
let redisClient: Redis | null = null;

// Redis client getter with lazy initialization
export const redis = new Proxy({} as Redis, {
  get(target, prop) {
    if (!redisClient) {
      redisClient = createRedisClient();
    }
    const value = redisClient[prop as keyof Redis];
    return typeof value === 'function' ? value.bind(redisClient) : value;
  },
});

// Reset function for testing purposes
export const resetRedisClient = () => {
  redisClient = null;
};

// Safe operation wrapper with error handling
export const safeRedisOperation = async <T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    console.error('Redis operation failed:', error);
    return fallback;
  }
};
