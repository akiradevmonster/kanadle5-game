// Integration test setup for Redis testing
import { redis, resetRedisClient } from './src/lib/redis';

// Test data cleanup utility
export const cleanupTestData = async () => {
  try {
    // Get all keys with test prefix
    const keys = await redis.keys('test:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.warn('Test cleanup failed:', error);
  }
};

// Setup before each test
beforeEach(async () => {
  // Reset Redis client
  resetRedisClient();
  
  // Clean up any existing test data
  await cleanupTestData();
});

// Cleanup after each test
afterEach(async () => {
  await cleanupTestData();
});

// Global cleanup after all tests
afterAll(async () => {
  await cleanupTestData();
});