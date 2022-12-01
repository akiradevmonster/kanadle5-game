import { NextResponse } from 'next/server';
import { redis, safeRedisOperation } from '@/lib/redis';

export async function GET() {
  try {
    // Test basic Redis operations
    const testKey = `health_check_${Date.now()}`;
    const testValue = 'Redis connection test';

    // Test SET operation
    await safeRedisOperation(async () => redis.set(testKey, testValue), null);

    // Test GET operation
    const retrievedValue = await safeRedisOperation(async () => redis.get(testKey), null);

    // Test DELETE operation
    await safeRedisOperation(async () => redis.del(testKey), null);

    // Test PING operation
    const pingResult = await safeRedisOperation(async () => redis.ping(), 'FAILED');

    return NextResponse.json({
      status: 'success',
      message: 'Redis connection test passed',
      tests: {
        ping: pingResult,
        setGet: retrievedValue === testValue,
        operations: 'All basic operations working',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Redis connection test failed:', error);

    return NextResponse.json(
      {
        status: 'error',
        message: 'Redis connection test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
