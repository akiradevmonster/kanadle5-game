import { generateWordId } from '../lib/wordId';

/**
 * Basic word entity structure
 * Represents a single word in the daily word system
 */
export type WordEntity = {
  /** Unique 8-character alphanumeric identifier */
  id: string;
  /** The hiragana word (5 characters) */
  word: string;
  /** ISO 8601 timestamp when the word entity was created */
  createdAt: string;
  /** Whether this word is currently active in the system */
  isActive: boolean;
  /** Optional metadata for extensibility */
  metadata?: {
    /** Difficulty level (easy, medium, hard) */
    difficulty?: 'easy' | 'medium' | 'hard';
    /** Category classification */
    category?: string;
    /** Source of the word (dictionary, manual, etc.) */
    source?: string;
    /** Any additional custom properties */
    [key: string]: unknown;
  };
};

/**
 * Word master entry - extends WordEntity with master database specific fields
 * Used for managing the master word database
 */
export type WordMasterEntry = WordEntity & {
  /** ISO 8601 timestamp when added to master database */
  addedToMaster: string;
  /** ISO 8601 timestamp of last assignment (null if never assigned) */
  lastAssigned: string | null;
  /** Number of times this word has been assigned */
  assignmentCount: number;
};

/**
 * Daily word assignment record
 * Tracks which word is assigned to which date
 */
export type DailyWordAssignment = {
  /** Date in YYYY-MM-DD format (JST timezone) */
  date: string;
  /** Word ID that is assigned to this date */
  wordId: string;
  /** ISO 8601 timestamp when this assignment was made */
  assignedAt: string;
  /** Month in YYYY-MM format for efficient querying */
  month: string;
  /** Optional metadata for assignment context */
  metadata?: {
    /** Reason for assignment (monthly_batch, manual, replacement) */
    assignmentReason?: 'monthly_batch' | 'manual' | 'replacement';
    /** Previous word ID if this is a replacement */
    previousWordId?: string;
    /** Any additional assignment properties */
    [key: string]: unknown;
  };
};

/**
 * Word usage statistics record
 * Tracks how a word has been used in the game
 */
export type WordUsageRecord = {
  /** Word ID this record refers to */
  wordId: string;
  /** Total number of times this word was played */
  totalPlays: number;
  /** Total number of successful completions */
  totalWins: number;
  /** Average number of attempts needed to complete */
  averageAttempts: number;
  /** ISO 8601 timestamp of first usage */
  firstUsed: string;
  /** ISO 8601 timestamp of most recent usage */
  lastUsed: string;
  /** ISO 8601 timestamp when this record was last updated */
  updatedAt: string;
  /** Distribution of completion attempts (1-6 attempts) */
  attemptDistribution?: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
    6: number;
  };
  /** Calculated difficulty score based on usage patterns */
  difficultyScore?: number;
};

/**
 * Creates a new word entity with generated ID and current timestamp
 *
 * @param word The hiragana word
 * @param metadata Optional metadata
 * @returns A new WordEntity
 */
export const createWordEntity = (word: string, metadata?: WordEntity['metadata']): WordEntity => {
  return {
    id: generateWordId(),
    word,
    createdAt: new Date().toISOString(),
    isActive: true,
    ...(metadata && { metadata }),
  };
};

/**
 * Type guard to check if an object is a valid WordEntity
 *
 * @param obj Object to validate
 * @returns True if obj is a valid WordEntity
 */
export const isValidWordEntity = (obj: unknown): obj is WordEntity => {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const entity = obj as Record<string, unknown>;

  // Check required fields
  if (typeof entity.id !== 'string' || entity.id.length !== 8) {
    return false;
  }

  if (typeof entity.word !== 'string' || entity.word.length !== 5) {
    return false;
  }

  if (typeof entity.createdAt !== 'string') {
    return false;
  }

  if (typeof entity.isActive !== 'boolean') {
    return false;
  }

  // Validate createdAt is a valid ISO 8601 timestamp
  const date = new Date(entity.createdAt);
  if (isNaN(date.getTime())) {
    return false;
  }

  // Check word contains only hiragana characters
  const hiraganaRegex = /^[\u3041-\u3096]+$/;
  if (!hiraganaRegex.test(entity.word)) {
    return false;
  }

  return true;
};

/**
 * Validates a word entity and throws an error if invalid
 *
 * @param obj Object to validate
 * @throws Error if the object is not a valid WordEntity
 */
export const validateWordEntity = (obj: unknown): asserts obj is WordEntity => {
  if (!isValidWordEntity(obj)) {
    throw new Error(
      'Invalid word entity: must have valid id, word, createdAt, and isActive fields'
    );
  }
};
