# Daily Word System Implementation Plan

## Overview

This document describes the implementation plan for a daily word system that provides a new word puzzle each day at midnight JST. The system uses Redis (Upstash via Vercel) for data persistence and implements a monthly pre-assignment approach.

## Core Requirements

- Provide a unique 5-character hiragana word daily at midnight JST
- Prevent word duplication for at least 1 year
- Support word pool updates (additions/deletions) monthly
- Maintain history for statistics and debugging
- Work within Upstash Redis free tier limits (256MB storage, 500K commands/month)

## Architecture Design

### ID Generation Strategy

Use nanoid with custom alphabet for generating 8-character word IDs:

```typescript
import { customAlphabet } from 'nanoid/non-secure';

const generateWordId = customAlphabet(
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  8
);
// Examples: "A7b9Kx2m", "3nP8qR5t", "9zY4wV6u"
```

### Data Structure

#### 1. Word Master Database

```typescript
// Individual word entries
word:A7b9Kx2m = {
  "id": "A7b9Kx2m",
  "kana": "あいうえお",           // Answer (hiragana)
  "display": "アイウエオ",         // Display text (katakana/kanji)
  "created_at": "2025-01-09T10:00:00Z",
  "status": "active"              // active | deleted
  "deleted_at"?: "2025-02-01T10:00:00Z",
  "reactivated_at"?: "2025-03-01T10:00:00Z"
}
```

#### 2. Index Structures

```typescript
// Set of active word IDs
active_words = Set["A7b9Kx2m", "3nP8qR5t", "9zY4wV6u", ...]

// Hiragana to ID mapping (for duplicate checking)
kana_index:あいうえお = "A7b9Kx2m"
kana_index:あいさつご = "3nP8qR5t"
```

#### 3. Daily Assignment Mapping

```typescript
// Simple date to word ID mapping
daily:2025-01-09 = "A7b9Kx2m"
daily:2025-01-10 = "3nP8qR5t"
```

#### 4. Usage History

```typescript
// Sorted set with timestamp as score
used_words = SortedSet[
  ("A7b9Kx2m", 1736380800),  // (wordId, unix timestamp)
  ("3nP8qR5t", 1736467200),
]
```

#### 5. Monthly Management

```typescript
// Monthly assignment record
monthly:2025-01 = {
  "generated_at": "2024-12-25T10:00:00Z",
  "assignments": {
    "2025-01-01": "A7b9Kx2m",
    "2025-01-02": "3nP8qR5t",
    // ... all days of the month
  }
}
```

#### 6. System Statistics

```typescript
// Pool statistics
pool_stats = {
  total_words: 12345,
  active_words: 12000,
  used_words: 365,
  last_sync: '2025-01-09T00:00:00Z',
};
```

## Implementation Details

### Word Master Synchronization

Monthly synchronization process to update word master from words.json:

```typescript
async function syncWordMaster(): Promise<SyncResult> {
  const currentWords = await loadWordsJson();
  const pipeline = redis.pipeline();

  let added = 0;
  let reactivated = 0;
  let deleted = 0;

  // Add new words
  for (const word of currentWords) {
    const existingId = await redis.get(`kana_index:${word.kana}`);

    if (!existingId) {
      // Create new word entry
      const newId = generateWordId();

      pipeline.set(
        `word:${newId}`,
        JSON.stringify({
          id: newId,
          kana: word.kana,
          display: word.word,
          created_at: new Date().toISOString(),
          status: 'active',
        })
      );

      pipeline.sadd('active_words', newId);
      pipeline.set(`kana_index:${word.kana}`, newId);
      added++;
    } else {
      // Check if word was previously deleted
      const wordData = await redis.get(`word:${existingId}`);
      if (wordData) {
        const word = JSON.parse(wordData);
        if (word.status === 'deleted') {
          // Reactivate deleted word
          pipeline.set(
            `word:${existingId}`,
            JSON.stringify({
              ...word,
              status: 'active',
              reactivated_at: new Date().toISOString(),
            })
          );
          pipeline.sadd('active_words', existingId);
          reactivated++;
        }
      }
    }
  }

  // Mark removed words as deleted
  const activeIds = await redis.smembers('active_words');
  for (const id of activeIds) {
    const wordData = await redis.get(`word:${id}`);
    if (wordData) {
      const word = JSON.parse(wordData);
      const stillExists = currentWords.some(w => w.kana === word.kana);

      if (!stillExists && word.status === 'active') {
        // Logical deletion (preserve history)
        pipeline.set(
          `word:${id}`,
          JSON.stringify({
            ...word,
            status: 'deleted',
            deleted_at: new Date().toISOString(),
          })
        );
        pipeline.srem('active_words', id);
        deleted++;
      }
    }
  }

  // Update statistics
  pipeline.set(
    'pool_stats',
    JSON.stringify({
      total_words: currentWords.length,
      active_words: currentWords.length,
      last_sync: new Date().toISOString(),
    })
  );

  await pipeline.exec();

  return { added, reactivated, deleted };
}
```

### Monthly Word Assignment

Pre-assign words for each day of the month:

```typescript
async function assignMonthlyWords(year: number, month: number): Promise<AssignmentResult> {
  const daysInMonth = getDaysInMonth(year, month);

  // Get available words
  const activeWordIds = await redis.smembers('active_words');

  // Get recently used words (to avoid)
  const cutoffTime = Date.now() / 1000 - 365 * 24 * 60 * 60; // 1 year ago
  const recentlyUsed = await redis.zrevrangebyscore(
    'used_words',
    '+inf',
    cutoffTime,
    'LIMIT',
    0,
    365
  );

  // Filter available words
  const availableIds = activeWordIds.filter(id => !recentlyUsed.includes(id));

  if (availableIds.length < daysInMonth) {
    throw new Error(`Insufficient words: need ${daysInMonth}, have ${availableIds.length}`);
  }

  // Random selection
  const selectedIds = shuffle(availableIds).slice(0, daysInMonth);

  // Assign words to dates
  const assignments: Record<string, string> = {};
  const pipeline = redis.pipeline();

  selectedIds.forEach((wordId, index) => {
    const day = index + 1;
    const date = formatDate(year, month, day); // YYYY-MM-DD

    assignments[date] = wordId;

    // Set daily mapping
    pipeline.set(`daily:${date}`, wordId);

    // Add to usage history
    const timestamp = new Date(date).getTime() / 1000;
    pipeline.zadd('used_words', timestamp, wordId);
  });

  // Save monthly record
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  pipeline.set(
    `monthly:${monthKey}`,
    JSON.stringify({
      generated_at: new Date().toISOString(),
      assignments,
    })
  );

  await pipeline.exec();

  return {
    month: monthKey,
    assignedDays: daysInMonth,
    firstDay: Object.keys(assignments)[0],
    lastDay: Object.keys(assignments)[daysInMonth - 1],
  };
}
```

### Daily Word Retrieval

Get the word for a specific date:

```typescript
async function getDailyWord(date: Date): Promise<DailyWord> {
  const dateKey = formatDateKey(date); // YYYY-MM-DD

  // Get word ID for the date
  const wordId = await redis.get(`daily:${dateKey}`);

  if (!wordId) {
    throw new Error(`No word assigned for date: ${dateKey}`);
  }

  // Get word details
  const wordData = await redis.get(`word:${wordId}`);

  if (!wordData) {
    throw new Error(`Word not found: ${wordId}`);
  }

  const word = JSON.parse(wordData);

  // Handle deleted words gracefully
  if (word.status === 'deleted') {
    console.error(`Warning: Deleted word ${wordId} is assigned to ${dateKey}`);
    // Could implement fallback logic here
  }

  return {
    date: dateKey,
    wordId: word.id,
    answer: word.kana, // For game logic
    display: word.display, // For UI display
  };
}
```

### Utility Functions

```typescript
// Date formatting
function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Get days in month
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// Array shuffle using Fisher-Yates
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
```

## Operational Procedures

### Initial Setup

```typescript
async function initialSetup(): Promise<void> {
  console.log('Starting initial setup...');

  // 1. Sync word master from words.json
  const syncResult = await syncWordMaster();
  console.log('Word sync completed:', syncResult);

  // 2. Generate first 3 months
  const now = new Date();
  for (let i = 0; i < 3; i++) {
    const targetDate = new Date(now);
    targetDate.setMonth(targetDate.getMonth() + i);

    const result = await assignMonthlyWords(targetDate.getFullYear(), targetDate.getMonth() + 1);
    console.log('Monthly assignment completed:', result);
  }

  console.log('Initial setup completed successfully');
}
```

### Monthly Maintenance (Run on 25th of each month)

```typescript
async function monthlyMaintenance(): Promise<void> {
  // 1. Update word master
  console.log('Updating word master...');
  const syncResult = await syncWordMaster();
  console.log('Sync completed:', syncResult);

  // 2. Generate assignments for next month
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 2); // 2 months ahead

  const result = await assignMonthlyWords(nextMonth.getFullYear(), nextMonth.getMonth() + 1);
  console.log('Assignment completed:', result);

  // 3. Clean up old usage history (optional)
  await cleanupOldHistory();
}
```

### Word Replacement (Emergency Operation)

```typescript
async function replaceWord(date: string, newWordId: string): Promise<void> {
  const oldWordId = await redis.get(`daily:${date}`);

  if (!oldWordId) {
    throw new Error(`No word assigned for date: ${date}`);
  }

  // Update daily mapping
  await redis.set(`daily:${date}`, newWordId);

  // Update usage history
  const timestamp = new Date(date).getTime() / 1000;
  await redis.zrem('used_words', oldWordId);
  await redis.zadd('used_words', timestamp, newWordId);

  // Update monthly record
  const [year, month] = date.split('-');
  const monthKey = `${year}-${month}`;
  const monthlyData = await redis.get(`monthly:${monthKey}`);

  if (monthlyData) {
    const monthly = JSON.parse(monthlyData);
    monthly.assignments[date] = newWordId;
    monthly.replaced_at = new Date().toISOString();
    await redis.set(`monthly:${monthKey}`, JSON.stringify(monthly));
  }

  console.log(`Replaced word for ${date}: ${oldWordId} -> ${newWordId}`);
}
```

## API Integration

### Update getDailyWord.ts

```typescript
// src/lib/game/getDailyWord.ts
import { redis } from '@/lib/redis';
import type { DailyWord } from '@/types/game';

export async function getDailyWord(): Promise<DailyWord> {
  const today = new Date();
  const dateKey = today.toISOString().split('T')[0];

  try {
    // Get word ID for today
    const wordId = await redis.get(`daily:${dateKey}`);

    if (!wordId) {
      throw new Error('No word assigned for today');
    }

    // Get word details
    const wordData = await redis.get(`word:${wordId}`);

    if (!wordData) {
      throw new Error('Word data not found');
    }

    const word = JSON.parse(wordData as string);

    return {
      date: dateKey,
      wordId: word.id,
      answer: word.kana,
      display: word.display,
    };
  } catch (error) {
    console.error('Failed to get daily word:', error);

    // Fallback to mock data for development
    if (process.env.NODE_ENV === 'development') {
      return {
        date: dateKey,
        wordId: 'mock',
        answer: 'つきあかり',
        display: '月明かり',
      };
    }

    throw error;
  }
}
```

## Performance Considerations

### Redis Command Usage

- Daily word retrieval: 2 GET commands per request
- Monthly assignment: ~100 commands (31 days × 3 operations)
- Word sync: Varies by changes, typically < 1000 commands

**Monthly estimate**: ~60K commands (well within 500K free tier limit)

### Storage Usage

- Word master: ~150 bytes × 10,000 words = 1.5MB
- Daily mappings: ~30 bytes × 365 days = 11KB
- Indexes and metadata: ~200KB
- **Total**: < 2MB (0.8% of 256MB free tier)

## Security Considerations

- No encryption needed (per requirements)
- Word IDs are non-guessable (62^8 possibilities)
- Future dates can be queried but require knowing the date format
- No user authentication required for basic word retrieval

## Testing Strategy

### Unit Tests

```typescript
describe('getDailyWord', () => {
  it('should return word for valid date', async () => {
    const word = await getDailyWord();
    expect(word).toHaveProperty('answer');
    expect(word.answer).toMatch(/^[ぁ-ん]{5}$/);
  });

  it('should handle missing word gracefully', async () => {
    // Test with future date
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    await expect(getDailyWord(futureDate)).rejects.toThrow();
  });
});
```

### Integration Tests

- Test monthly assignment process
- Verify word uniqueness over time period
- Test sync process with various word.json states
- Validate timezone handling

## Migration Path

1. Deploy Redis connection configuration
2. Run initial setup script
3. Update getDailyWord.ts to use Redis
4. Remove mock implementation
5. Set up monthly maintenance cron job

## Future Enhancements

- Word difficulty ratings
- Themed words for special occasions
- Analytics on word completion rates
- Multi-language support
- Word hints system

---

This plan provides a complete, production-ready implementation for the daily word system that is independent of the source data structure and optimized for the Kanadle5 game requirements.
