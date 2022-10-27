# Redis on Vercel Implementation Guide for Next.js

## Overview

This guide covers implementing Upstash Redis (Free Plan) via Vercel Marketplace in a Next.js application. Redis provides fast key-value storage ideal for caching, session management, rate limiting, and real-time features.

## Prerequisites

- Vercel account with an active project
- Next.js 14+ application (App Router recommended)
- Basic understanding of Redis concepts

## Free Plan Limitations

- **Data Size**: 256 MB
- **Monthly Commands**: 500K
- **Bandwidth**: 10 GB
- **Persistence**: Enabled
- **Global Replication**: Available

## Setup Instructions

### 1. Install Redis from Vercel Marketplace

1. Navigate to [Vercel Marketplace](https://vercel.com/marketplace)
2. Search for "Redis" and select the Upstash Redis integration
3. Click "Add Integration"
4. Select your project and click "Install"
5. Choose a database name and region (select closest to your users)
6. Confirm the Free Plan selection

### 2. Environment Variables Configuration

After installation, Vercel automatically creates environment variables. Verify they exist in your project settings:

```bash
# These are automatically created by Vercel
REDIS_URL=rediss://default:[password]@[host]:[port]
KV_REST_API_URL=https://[endpoint].upstash.io
KV_REST_API_TOKEN=[token]
```

### 3. Install Dependencies

```bash
npm install @upstash/redis
# or
yarn add @upstash/redis
```

## Basic Configuration

### 1. Redis Client Setup

Create a Redis client configuration file:

```typescript
// lib/redis.ts
import { Redis } from '@upstash/redis';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  throw new Error('Redis environment variables are not set');
}

export const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// Helper function for error handling
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
```

### 2. Connection Testing

Create a simple test endpoint:

```typescript
// app/api/redis-test/route.ts
import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test basic operations
    await redis.set('test-key', 'Hello Redis!');
    const value = await redis.get('test-key');
    await redis.del('test-key');

    return NextResponse.json({
      status: 'success',
      message: 'Redis connection successful',
      testValue: value,
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Redis connection failed', error },
      { status: 500 }
    );
  }
}
```

## Implementation Patterns

### 1. Small Persistent Data Storage

Store and retrieve small data objects (~500 bytes) efficiently:

```typescript
// lib/persistent-data.ts
import { redis, safeRedisOperation } from './redis';

export interface SmallDataItem {
  id: string;
  data: any;
  category?: string;
  updatedAt: number;
}

export class PersistentData {
  private static PREFIX = 'data:';

  static async store(item: Omit<SmallDataItem, 'updatedAt'>): Promise<boolean> {
    return safeRedisOperation(async () => {
      const dataToStore: SmallDataItem = {
        ...item,
        updatedAt: Date.now(),
      };
      await redis.set(`${this.PREFIX}${item.id}`, JSON.stringify(dataToStore));

      // Index by category if provided
      if (item.category) {
        await redis.sadd(`category:${item.category}`, item.id);
      }

      return true;
    }, false);
  }

  static async get(id: string): Promise<SmallDataItem | null> {
    return safeRedisOperation(async () => {
      const data = await redis.get(`${this.PREFIX}${id}`);
      return data ? JSON.parse(data as string) : null;
    }, null);
  }

  static async getByCategory(category: string): Promise<SmallDataItem[]> {
    return safeRedisOperation(async () => {
      const ids = await redis.smembers(`category:${category}`);
      if (ids.length === 0) return [];

      const pipeline = redis.pipeline();
      ids.forEach(id => pipeline.get(`${this.PREFIX}${id}`));

      const results = await pipeline.exec();
      return results.filter(result => result !== null).map(result => JSON.parse(result as string));
    }, []);
  }

  static async delete(id: string): Promise<void> {
    await safeRedisOperation(async () => {
      // Get item to check category
      const item = await this.get(id);

      // Remove from main storage
      await redis.del(`${this.PREFIX}${id}`);

      // Remove from category index
      if (item?.category) {
        await redis.srem(`category:${item.category}`, id);
      }
    }, undefined);
  }
}

// Usage in API route
// app/api/data/[id]/route.ts
import { PersistentData } from '@/lib/persistent-data';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const item = await PersistentData.get(params.id);

  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function POST(request: Request) {
  const { id, data, category } = await request.json();

  const success = await PersistentData.store({ id, data, category });

  if (!success) {
    return NextResponse.json({ error: 'Failed to store data' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

### 2. OAuth Session Management

Manage user sessions with external OAuth providers:

```typescript
// lib/oauth-session.ts
import { redis } from './redis';
import { nanoid } from 'nanoid';

export interface OAuthSession {
  userId: string;
  email: string;
  name: string;
  provider: 'google' | 'github' | 'discord'; // etc.
  providerAccountId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  createdAt: number;
  lastActive: number;
}

export class OAuthSessionManager {
  private static PREFIX = 'oauth_session:';
  private static USER_PREFIX = 'user_sessions:';
  private static TTL = 30 * 24 * 60 * 60; // 30 days

  static async create(
    sessionData: Omit<OAuthSession, 'createdAt' | 'lastActive'>
  ): Promise<string> {
    const sessionId = nanoid();
    const session: OAuthSession = {
      ...sessionData,
      createdAt: Date.now(),
      lastActive: Date.now(),
    };

    await redis.setex(`${this.PREFIX}${sessionId}`, this.TTL, JSON.stringify(session));

    // Index by user ID for multiple device support
    await redis.sadd(`${this.USER_PREFIX}${sessionData.userId}`, sessionId);

    return sessionId;
  }

  static async get(sessionId: string): Promise<OAuthSession | null> {
    const data = await redis.get(`${this.PREFIX}${sessionId}`);
    if (!data) return null;

    const session = JSON.parse(data as string) as OAuthSession;

    // Update last active time
    session.lastActive = Date.now();
    await redis.setex(`${this.PREFIX}${sessionId}`, this.TTL, JSON.stringify(session));

    return session;
  }

  static async getUserSessions(userId: string): Promise<string[]> {
    return (await redis.smembers(`${this.USER_PREFIX}${userId}`)) || [];
  }

  static async refresh(sessionId: string): Promise<boolean> {
    const session = await this.get(sessionId);
    if (!session) return false;

    await redis.expire(`${this.PREFIX}${sessionId}`, this.TTL);
    return true;
  }

  static async destroy(sessionId: string): Promise<void> {
    const session = await this.get(sessionId);
    if (session) {
      await redis.del(`${this.PREFIX}${sessionId}`);
      await redis.srem(`${this.USER_PREFIX}${session.userId}`, sessionId);
    }
  }

  static async destroyAllUserSessions(userId: string): Promise<void> {
    const sessionIds = await this.getUserSessions(userId);

    if (sessionIds.length > 0) {
      const pipeline = redis.pipeline();
      sessionIds.forEach(id => pipeline.del(`${this.PREFIX}${id}`));
      pipeline.del(`${this.USER_PREFIX}${userId}`);
      await pipeline.exec();
    }
  }
}

// Middleware for OAuth session validation
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { OAuthSessionManager } from '@/lib/oauth-session';

export async function middleware(request: NextRequest) {
  const sessionId = request.cookies.get('session-id')?.value;

  if (!sessionId) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  const session = await OAuthSessionManager.get(sessionId);
  if (!session) {
    const response = NextResponse.redirect(new URL('/auth/signin', request.url));
    response.cookies.delete('session-id');
    return response;
  }

  return NextResponse.next();
}
```

### 3. User Activity History

Track user interactions like quiz answers and activity logs:

```typescript
// lib/user-activity.ts
import { redis } from './redis';

export interface QuizAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timestamp: number;
  timeSpent: number; // seconds
}

export interface ActivityEntry {
  id: string;
  userId: string;
  type: 'quiz_answer' | 'page_visit' | 'feature_used';
  data: QuizAnswer | any;
  timestamp: number;
}

export class UserActivityTracker {
  private static PREFIX = 'activity:';
  private static USER_INDEX = 'user_activity:';
  private static MAX_ENTRIES_PER_USER = 1000;

  static async recordQuizAnswer(
    userId: string,
    questionId: string,
    answer: string,
    isCorrect: boolean,
    timeSpent: number
  ): Promise<void> {
    const activity: ActivityEntry = {
      id: `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: 'quiz_answer',
      data: {
        questionId,
        answer,
        isCorrect,
        timestamp: Date.now(),
        timeSpent,
      },
      timestamp: Date.now(),
    };

    await this.recordActivity(activity);
  }

  static async recordActivity(activity: ActivityEntry): Promise<void> {
    await safeRedisOperation(async () => {
      // Store the activity
      await redis.setex(
        `${this.PREFIX}${activity.id}`,
        90 * 24 * 60 * 60, // 90 days
        JSON.stringify(activity)
      );

      // Add to user's activity timeline (sorted set with timestamp as score)
      await redis.zadd(`${this.USER_INDEX}${activity.userId}`, activity.timestamp, activity.id);

      // Keep only the latest N entries per user
      await redis.zremrangebyrank(
        `${this.USER_INDEX}${activity.userId}`,
        0,
        -(this.MAX_ENTRIES_PER_USER + 1)
      );

      // Set expiry on the user index
      await redis.expire(`${this.USER_INDEX}${activity.userId}`, 90 * 24 * 60 * 60);
    }, undefined);
  }

  static async getUserActivity(
    userId: string,
    limit: number = 50,
    before?: number
  ): Promise<ActivityEntry[]> {
    return safeRedisOperation(async () => {
      const maxScore = before || '+inf';

      // Get activity IDs from user's timeline
      const activityIds = await redis.zrevrangebyscore(
        `${this.USER_INDEX}${userId}`,
        maxScore,
        '-inf',
        'LIMIT',
        0,
        limit
      );

      if (activityIds.length === 0) return [];

      // Fetch activity details
      const pipeline = redis.pipeline();
      activityIds.forEach(id => pipeline.get(`${this.PREFIX}${id}`));

      const results = await pipeline.exec();

      return results.filter(result => result !== null).map(result => JSON.parse(result as string));
    }, []);
  }

  static async getQuizResults(userId: string, limit: number = 20): Promise<QuizAnswer[]> {
    const activities = await this.getUserActivity(userId, limit);

    return activities
      .filter(activity => activity.type === 'quiz_answer')
      .map(activity => activity.data as QuizAnswer);
  }

  static async getQuizStats(userId: string): Promise<{
    totalAnswers: number;
    correctAnswers: number;
    accuracy: number;
    averageTimeSpent: number;
  }> {
    const quizResults = await this.getQuizResults(userId, 500); // Get more for stats

    if (quizResults.length === 0) {
      return { totalAnswers: 0, correctAnswers: 0, accuracy: 0, averageTimeSpent: 0 };
    }

    const correctAnswers = quizResults.filter(r => r.isCorrect).length;
    const totalTimeSpent = quizResults.reduce((sum, r) => sum + r.timeSpent, 0);

    return {
      totalAnswers: quizResults.length,
      correctAnswers,
      accuracy: Math.round((correctAnswers / quizResults.length) * 100),
      averageTimeSpent: Math.round(totalTimeSpent / quizResults.length),
    };
  }
}

// Usage in API routes
// app/api/quiz/answer/route.ts
import { UserActivityTracker } from '@/lib/user-activity';

export async function POST(request: Request) {
  const { userId, questionId, answer, isCorrect, timeSpent } = await request.json();

  await UserActivityTracker.recordQuizAnswer(userId, questionId, answer, isCorrect, timeSpent);

  return NextResponse.json({ success: true });
}

// app/api/user/[userId]/stats/route.ts
export async function GET(request: Request, { params }: { params: { userId: string } }) {
  const stats = await UserActivityTracker.getQuizStats(params.userId);
  return NextResponse.json(stats);
}
```

## Performance Optimization

### 1. Efficient Data Operations

```typescript
// lib/redis-utils.ts
import { redis } from './redis';

export class RedisUtils {
  // Batch operations for multiple small data items
  static async batchGet(keys: string[]): Promise<Record<string, any>> {
    if (keys.length === 0) return {};

    const pipeline = redis.pipeline();
    keys.forEach(key => pipeline.get(key));

    const results = await pipeline.exec();
    const data: Record<string, any> = {};

    keys.forEach((key, index) => {
      if (results[index] !== null) {
        data[key] = JSON.parse(results[index] as string);
      }
    });

    return data;
  }

  // Efficient data counting
  static async countUserActivities(userId: string): Promise<number> {
    return (await redis.zcard(`user_activity:${userId}`)) || 0;
  }

  // Memory-efficient pagination
  static async getActivityPage(
    userId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<string[]> {
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    return await redis.zrevrange(`user_activity:${userId}`, start, end);
  }
}
```

### 2. Connection Management

```typescript
// lib/redis-connection.ts
import { Redis } from '@upstash/redis';

// Simple singleton pattern for Upstash
class RedisConnection {
  private static instance: Redis;

  static getInstance(): Redis {
    if (!this.instance) {
      this.instance = new Redis({
        url: process.env.KV_REST_API_URL!,
        token: process.env.KV_REST_API_TOKEN!,
      });
    }
    return this.instance;
  }
}

export const redisClient = RedisConnection.getInstance();
```

## Error Handling and Monitoring

### 1. Simple Error Handling

```typescript
// lib/redis-safe.ts
import { redis } from './redis';

export class SafeRedis {
  static async get<T>(key: string, defaultValue: T | null = null): Promise<T | null> {
    try {
      const result = await redis.get(key);
      return result ? JSON.parse(result as string) : defaultValue;
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error);
      return defaultValue;
    }
  }

  static async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await redis.setex(key, ttl, serialized);
      } else {
        await redis.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  static async del(key: string): Promise<boolean> {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error);
      return false;
    }
  }
}
```

### 2. Basic Health Check

```typescript
// app/api/health/redis/route.ts
import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const testKey = `health_check_${Date.now()}`;
    await redis.set(testKey, 'ok');
    const result = await redis.get(testKey);
    await redis.del(testKey);

    if (result === 'ok') {
      return NextResponse.json({ status: 'healthy', timestamp: new Date().toISOString() });
    } else {
      throw new Error('Health check failed');
    }
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
```

## Best Practices

### 1. Key Naming Conventions

```typescript
// lib/redis-keys.ts
export const RedisKeys = {
  // Small persistent data
  data: (id: string) => `data:${id}`,
  dataCategory: (category: string) => `category:${category}`,

  // OAuth session management
  oauthSession: (sessionId: string) => `oauth_session:${sessionId}`,
  userSessions: (userId: string) => `user_sessions:${userId}`,

  // User activity tracking
  activity: (activityId: string) => `activity:${activityId}`,
  userActivity: (userId: string) => `user_activity:${userId}`,

  // Health checks
  healthCheck: () => `health_check_${Date.now()}`,
} as const;
```

### 2. Data Serialization

```typescript
// lib/serialization.ts
export class DataSerializer {
  static serialize(data: any): string {
    try {
      return JSON.stringify(data);
    } catch (error) {
      console.error('Serialization error:', error);
      throw new Error('Failed to serialize data');
    }
  }

  static deserialize<T>(data: string | null): T | null {
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Deserialization error:', error);
      return null;
    }
  }
}
```

### 3. TTL Management

```typescript
// lib/ttl-config.ts
export const TTLConfig = {
  // Session management
  OAUTH_SESSION: 30 * 24 * 60 * 60, // 30 days

  // Activity data
  USER_ACTIVITY: 90 * 24 * 60 * 60, // 90 days

  // Small data (no TTL - persistent)
  PERSISTENT_DATA: undefined,

  // Health checks
  HEALTH_CHECK: 10, // 10 seconds
} as const;
```

## Simple Configuration

```typescript
// lib/config.ts
const isProduction = process.env.NODE_ENV === 'production';

export const AppConfig = {
  redis: {
    enableLogging: !isProduction,
    maxRetries: 1,
    healthCheckInterval: 300000, // 5 minutes
  },

  session: {
    ttl: 30 * 24 * 60 * 60, // 30 days
    refreshThreshold: 7 * 24 * 60 * 60, // Refresh if expires in 7 days
  },

  activity: {
    maxEntriesPerUser: 1000,
    retentionDays: 90,
  },
} as const;
```

## Deployment Checklist

- [ ] Redis connection established in Vercel environment
- [ ] Environment variables properly configured
- [ ] OAuth session flow tested end-to-end
- [ ] Data storage and retrieval working correctly
- [ ] User activity tracking functional
- [ ] Error handling implemented with fallbacks
- [ ] Basic health check endpoint created
- [ ] Key naming conventions followed
- [ ] TTL settings appropriate for data types
- [ ] Free plan limits monitored (500K commands/month)

## Common Gotchas

1. **Free Plan Command Limit**: Monitor usage to stay within 500K commands/month
2. **JSON Serialization**: Always serialize/deserialize objects properly
3. **Session Expiry**: Implement proper refresh logic for OAuth sessions
4. **Error Fallbacks**: Always handle Redis failures gracefully
5. **Key Consistency**: Use consistent naming patterns across your app
6. **Activity Data Growth**: Implement cleanup for old user activity data
7. **Connection Reuse**: Use singleton pattern for Redis client
8. **Environment Variables**: Ensure Redis credentials are properly set in Vercel

---

_This simplified guide focuses on the core Redis patterns needed for small-scale applications with OAuth authentication and basic data persistence. The implementation is designed to work efficiently within the Upstash Free Plan limits._
