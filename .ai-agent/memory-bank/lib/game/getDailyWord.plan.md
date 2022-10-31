# getDailyWord Function Implementation Plan with Word List Persistence

## Overview

The `getDailyWord` function selects the daily word deterministically based on the given date. It ensures all users get the same word on the same day while handling word list persistence and updates.

## Architecture

```text
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│  words.json     │────▶│  Word List   │────▶│  getDailyWord│
│  (Initial Data) │     │  Manager     │     │   Function   │
└─────────────────┘     └──────┬───────┘     └─────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  Vercel KV   │
                        │   Storage    │
                        └──────────────┘
```

## Implementation Phases

### Phase 1: Word List Persistence Layer

#### Data Models

```typescript
// Data structure stored in Vercel KV
type StoredWordList = {
  version: number; // List version number
  updatedAt: string; // Last update timestamp
  words: string[]; // Array of 5-character hiragana words
};

// Daily word cache (to handle word list changes)
type DailyWordCache = {
  date: string; // YYYY-MM-DD (JST)
  word: string; // Word for that day
  listVersion: number; // Version of word list used
};
```

#### Word List Manager Interface

```typescript
// src/lib/storage/wordListManager.ts
interface WordListManager {
  // Initialize from words.json
  initialize(): Promise<void>;

  // Get current word list
  getWordList(): Promise<string[]>;

  // Update word list (admin function)
  updateWordList(words: string[]): Promise<void>;

  // Get version information
  getVersion(): Promise<number>;
}
```

### Phase 2: getDailyWord Function Implementation

#### Function Signature

```typescript
// src/lib/game/getDailyWord.ts
async function getDailyWord(date: Date): Promise<string>;
```

#### Implementation Strategy

```text
1. Convert date to JST YYYY-MM-DD format
2. Check DailyWordCache
   - If cached → return cached word
   - If not cached → continue
3. Get current word list from storage
4. Apply deterministic algorithm:
   a. Generate deterministic hash from date string
   b. Use hash % wordList.length to get index
   c. Select word at that index
5. Save to DailyWordCache
6. Return selected word
```

#### Deterministic Algorithm Details

```typescript
// Pseudo-code for deterministic selection
function selectWord(dateString: string, wordList: string[]): string {
  const hash = generateHash(dateString); // Simple hash function
  const index = hash % wordList.length;
  return wordList[index];
}
```

## Test Strategy

### Word List Manager Tests

- Initialization from words.json
- CRUD operations
- Version management
- Error handling
- Connection failures

### getDailyWord Tests

#### Basic Functionality

- Same date returns same word (multiple calls)
- Different dates return different words (usually)
- All words in list are selectable

#### Cache Functionality

- Cache hit returns same word
- Cache miss fetches and caches
- Cache invalidation on list update

#### Boundary Conditions

- Date change boundary (23:59:59 JST → 00:00:00 JST)
- Month-end/start transitions
- Year-end/start transitions
- UTC/JST timezone handling

#### Edge Cases

- Empty word list error handling
- Single-word list
- Null/undefined inputs
- Invalid date objects
- Storage connection failures

## Implementation Steps

### Step 1: Infrastructure Setup

```bash
# Create feature branch
git checkout main
git pull
git checkout -b feature/word-list-persistence
```

### Step 2: Word List Manager Implementation

1. Configure Vercel KV connection
2. Create `wordListManager.test.ts`
3. Implement `wordListManager.ts` (TDD approach)
4. Create initialization script

### Step 3: getDailyWord Implementation

1. Create `getDailyWord.test.ts`
2. Implement `getDailyWord.ts` (TDD approach)
3. Implement caching functionality
4. Integration testing

### Step 4: Migration Strategy

1. Define word list change policy
2. Implement version management
3. Define cache invalidation strategy

## Word List Change Handling Strategies

### Option A: Full Cache Approach (Recommended)

- Once selected, a date's word is permanently stored
- Word list changes don't affect past dates
- **Pros**: High consistency
- **Cons**: Increased storage usage

### Option B: Version-Fixed Approach

- Fix word list version at the start of each month
- Use same version throughout the month
- **Pros**: Balanced approach
- **Cons**: Complex month-boundary management

### Option C: Real-time Approach

- Always use latest word list
- Cache only for performance
- **Pros**: Simple implementation
- **Cons**: Words may change unexpectedly

**Recommendation**: Option A (Full Cache Approach) for maximum consistency

## Error Handling and Fallback Strategy

```typescript
// Fallback implementation
async function getDailyWordWithFallback(date: Date): Promise<string> {
  try {
    // Try to get from Vercel KV
    return await getDailyWord(date);
  } catch (error) {
    // Fallback: Use local words.json
    const localWords = await loadLocalWordList();
    return getDailyWordFromLocal(date, localWords);
  }
}
```

## Security Considerations

- Function runs **server-side only** to protect target word
- Word list stored securely in Vercel KV
- No word list or selection logic exposed to client
- API returns only evaluation results, never the target word

## Performance Considerations

- Cache daily words to minimize database queries
- Implement connection pooling for Vercel KV
- Use lightweight hash function for word selection
- Consider pre-warming cache for upcoming dates
