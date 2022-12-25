import { redis, resetRedisClient, safeRedisOperation } from './redis';

describe('Redis Integration Tests', () => {
  beforeEach(() => {
    resetRedisClient();
  });

  describe('Redis Connection', () => {
    it('should connect to Redis successfully', async () => {
      const result = await redis.ping();
      expect(result).toBe('PONG');
    });

    it('should set and get a value', async () => {
      const key = 'test:integration:simple';
      const value = 'test-value';

      await redis.set(key, value);
      const retrieved = await redis.get(key);

      expect(retrieved).toBe(value);
    });

    it('should handle JSON data', async () => {
      const key = 'test:integration:json';
      const data = { id: 'test-123', name: 'Test User' };

      await redis.set(key, data);
      const retrieved = await redis.get(key);
      expect(retrieved).toEqual(data);
    });

    it('should delete a key', async () => {
      const key = 'test:integration:delete';

      await redis.set(key, 'value-to-delete');
      const deleted = await redis.del(key);
      const retrieved = await redis.get(key);

      expect(deleted).toBe(1);
      expect(retrieved).toBeNull();
    });

    it('should list keys with pattern', async () => {
      const prefix = 'test:integration:pattern';
      const keys = [`${prefix}:1`, `${prefix}:2`, `${prefix}:3`];

      // Set multiple keys
      for (const key of keys) {
        await redis.set(key, 'test-value');
      }

      // Get keys with pattern
      const foundKeys = await redis.keys(`${prefix}:*`);

      expect(foundKeys).toHaveLength(3);
      expect(foundKeys.sort()).toEqual(keys.sort());
    });
  });

  describe('Safe Redis Operations', () => {
    it('should handle successful operations', async () => {
      const result = await safeRedisOperation(
        () => redis.set('test:integration:safe', 'safe-value'),
        'fallback'
      );

      expect(result).toBe('OK');
    });

    it('should return fallback on error', async () => {
      // Mock Redis operation that fails
      const failingOperation = () => {
        throw new Error('Redis connection failed');
      };

      const result = await safeRedisOperation(failingOperation, 'fallback-value');

      expect(result).toBe('fallback-value');
    });
  });

  describe('Environment Validation', () => {
    it('should work with current environment variables', () => {
      // This test ensures environment variables are properly set
      expect(process.env.KV_REST_API_URL).toBeDefined();
      expect(process.env.KV_REST_API_TOKEN).toBeDefined();
    });
  });
});
