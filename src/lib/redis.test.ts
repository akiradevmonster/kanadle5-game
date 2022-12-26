// Set up environment variables before any imports
process.env.KV_REST_API_URL = 'https://test-endpoint.upstash.io';
process.env.KV_REST_API_TOKEN = 'test-token';

// Mock the @upstash/redis module before importing
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn(),
}));

// Now import after mocking and env setup
import { Redis } from '@upstash/redis';
import { redis, safeRedisOperation, resetRedisClient } from './redis';

const mockRedisConstructor = Redis as jest.MockedClass<typeof Redis>;

describe('Redis Connection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetRedisClient(); // Reset Redis client state between tests
    process.env.KV_REST_API_URL = 'https://test-endpoint.upstash.io';
    process.env.KV_REST_API_TOKEN = 'test-token';
  });

  afterEach(() => {
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
  });

  describe('Redis Client Creation', () => {
    it('should create Redis client with correct configuration', async () => {
      // Set up mock before triggering initialization
      const mockInstance = {
        ping: jest.fn().mockResolvedValue('PONG'),
      } as unknown as Redis;
      mockRedisConstructor.mockImplementation(() => mockInstance);

      // Trigger lazy initialization by accessing a Redis method
      const pingMethod = redis.ping;
      expect(pingMethod).toBeDefined();

      expect(mockRedisConstructor).toHaveBeenCalledWith({
        url: 'https://test-endpoint.upstash.io',
        token: 'test-token',
      });
    });

    it('should throw error when environment variables are missing', () => {
      delete process.env.KV_REST_API_URL;
      delete process.env.KV_REST_API_TOKEN;

      expect(() => {
        // Trigger lazy initialization to check environment variables
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        redis.ping;
      }).toThrow('Redis environment variables are not set');
    });

    it('should throw error when KV_REST_API_URL is missing', () => {
      delete process.env.KV_REST_API_URL;

      expect(() => {
        // Trigger lazy initialization to check environment variables
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        redis.ping;
      }).toThrow('Redis environment variables are not set');
    });

    it('should throw error when KV_REST_API_TOKEN is missing', () => {
      delete process.env.KV_REST_API_TOKEN;

      expect(() => {
        // Trigger lazy initialization to check environment variables
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        redis.ping;
      }).toThrow('Redis environment variables are not set');
    });
  });

  describe('safeRedisOperation', () => {
    const mockOperation = jest.fn();
    const fallbackValue = 'fallback';

    beforeEach(() => {
      mockOperation.mockClear();
    });

    it('should return operation result on success', async () => {
      const expectedResult = 'success';
      mockOperation.mockResolvedValue(expectedResult);

      const result = await safeRedisOperation(mockOperation, fallbackValue);

      expect(result).toBe(expectedResult);
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should return fallback value on operation failure', async () => {
      const error = new Error('Redis connection failed');
      mockOperation.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await safeRedisOperation(mockOperation, fallbackValue);

      expect(result).toBe(fallbackValue);
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith('Redis operation failed:', error);

      consoleSpy.mockRestore();
    });

    it('should handle operation returning null/undefined', async () => {
      mockOperation.mockResolvedValue(null);

      const result = await safeRedisOperation(mockOperation, fallbackValue);

      expect(result).toBe(null);
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Basic Redis Operations', () => {
    let mockRedisInstance: jest.Mocked<Redis>;

    beforeEach(() => {
      mockRedisInstance = {
        set: jest.fn(),
        get: jest.fn(),
        del: jest.fn(),
        ping: jest.fn(),
      } as unknown as jest.Mocked<Redis>;

      mockRedisConstructor.mockImplementation(() => mockRedisInstance);
      resetRedisClient(); // Ensure fresh client for each test
    });

    it('should perform basic set operation', async () => {
      mockRedisInstance.set.mockResolvedValue('OK');

      const testKey = 'test-key';
      const testValue = 'test-value';

      await redis.set(testKey, testValue);

      expect(mockRedisInstance.set).toHaveBeenCalledWith(testKey, testValue);
    });

    it('should perform basic get operation', async () => {
      const expectedValue = 'test-value';
      mockRedisInstance.get.mockResolvedValue(expectedValue);

      const result = await redis.get('test-key');

      expect(result).toBe(expectedValue);
      expect(mockRedisInstance.get).toHaveBeenCalledWith('test-key');
    });

    it('should perform basic delete operation', async () => {
      mockRedisInstance.del.mockResolvedValue(1);

      await redis.del('test-key');

      expect(mockRedisInstance.del).toHaveBeenCalledWith('test-key');
    });

    it('should perform ping operation for health check', async () => {
      mockRedisInstance.ping.mockResolvedValue('PONG');

      const result = await redis.ping();

      expect(result).toBe('PONG');
      expect(mockRedisInstance.ping).toHaveBeenCalledTimes(1);
    });
  });
});
