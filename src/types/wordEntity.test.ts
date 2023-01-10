// Mock nanoid before importing
jest.mock('nanoid', () => ({
  nanoid: jest.fn(),
  customAlphabet: jest.fn(),
}));

import type {
  WordEntity,
  WordMasterEntry,
  DailyWordAssignment,
  WordUsageRecord,
} from './wordEntity';
import { createWordEntity, isValidWordEntity, validateWordEntity } from './wordEntity';
import { customAlphabet } from 'nanoid';

const mockCustomAlphabet = customAlphabet as jest.MockedFunction<typeof customAlphabet>;

describe('Word Entity Types', () => {
  describe('WordEntity', () => {
    it('should have correct structure for word entity', () => {
      const wordEntity: WordEntity = {
        id: 'abcd1234',
        word: 'つきあかり',
        createdAt: '2025-06-10T08:30:00.000Z',
        isActive: true,
      };

      expect(wordEntity.id).toBe('abcd1234');
      expect(wordEntity.word).toBe('つきあかり');
      expect(wordEntity.createdAt).toBe('2025-06-10T08:30:00.000Z');
      expect(wordEntity.isActive).toBe(true);
    });

    it('should support optional metadata fields', () => {
      const wordEntityWithMetadata: WordEntity = {
        id: 'efgh5678',
        word: 'さくらんぼ',
        createdAt: '2025-06-10T08:30:00.000Z',
        isActive: true,
        metadata: {
          difficulty: 'medium',
          category: 'food',
          source: 'dictionary',
        },
      };

      expect(wordEntityWithMetadata.metadata?.difficulty).toBe('medium');
      expect(wordEntityWithMetadata.metadata?.category).toBe('food');
      expect(wordEntityWithMetadata.metadata?.source).toBe('dictionary');
    });
  });

  describe('WordMasterEntry', () => {
    it('should extend WordEntity with master-specific fields', () => {
      const masterEntry: WordMasterEntry = {
        id: 'ijkl9012',
        word: 'ひまわり',
        createdAt: '2025-06-10T08:30:00.000Z',
        isActive: true,
        addedToMaster: '2025-06-10T08:30:00.000Z',
        lastAssigned: '2025-06-15T00:00:00.000Z',
        assignmentCount: 1,
      };

      expect(masterEntry.addedToMaster).toBe('2025-06-10T08:30:00.000Z');
      expect(masterEntry.lastAssigned).toBe('2025-06-15T00:00:00.000Z');
      expect(masterEntry.assignmentCount).toBe(1);
    });

    it('should support null lastAssigned for never-assigned words', () => {
      const neverAssigned: WordMasterEntry = {
        id: 'mnop3456',
        word: 'きらきら',
        createdAt: '2025-06-10T08:30:00.000Z',
        isActive: true,
        addedToMaster: '2025-06-10T08:30:00.000Z',
        lastAssigned: null,
        assignmentCount: 0,
      };

      expect(neverAssigned.lastAssigned).toBeNull();
      expect(neverAssigned.assignmentCount).toBe(0);
    });
  });

  describe('DailyWordAssignment', () => {
    it('should have correct structure for daily assignment', () => {
      const assignment: DailyWordAssignment = {
        date: '2025-06-15',
        wordId: 'qrst7890',
        assignedAt: '2025-06-10T08:30:00.000Z',
        month: '2025-06',
      };

      expect(assignment.date).toBe('2025-06-15');
      expect(assignment.wordId).toBe('qrst7890');
      expect(assignment.assignedAt).toBe('2025-06-10T08:30:00.000Z');
      expect(assignment.month).toBe('2025-06');
    });

    it('should support optional metadata', () => {
      const assignmentWithMetadata: DailyWordAssignment = {
        date: '2025-06-20',
        wordId: 'uvwx4567',
        assignedAt: '2025-06-10T08:30:00.000Z',
        month: '2025-06',
        metadata: {
          assignmentReason: 'monthly_batch',
          previousWordId: 'abcd1234',
        },
      };

      expect(assignmentWithMetadata.metadata?.assignmentReason).toBe('monthly_batch');
      expect(assignmentWithMetadata.metadata?.previousWordId).toBe('abcd1234');
    });
  });

  describe('WordUsageRecord', () => {
    it('should track word usage statistics', () => {
      const usageRecord: WordUsageRecord = {
        wordId: 'yzab8901',
        totalPlays: 150,
        totalWins: 120,
        averageAttempts: 3.2,
        firstUsed: '2025-06-15T00:00:00.000Z',
        lastUsed: '2025-06-15T23:59:59.000Z',
        updatedAt: '2025-06-16T00:00:00.000Z',
      };

      expect(usageRecord.totalPlays).toBe(150);
      expect(usageRecord.totalWins).toBe(120);
      expect(usageRecord.averageAttempts).toBe(3.2);
      expect(usageRecord.firstUsed).toBe('2025-06-15T00:00:00.000Z');
      expect(usageRecord.lastUsed).toBe('2025-06-15T23:59:59.000Z');
    });

    it('should support optional detailed statistics', () => {
      const detailedRecord: WordUsageRecord = {
        wordId: 'cdef2345',
        totalPlays: 200,
        totalWins: 160,
        averageAttempts: 3.5,
        firstUsed: '2025-06-01T00:00:00.000Z',
        lastUsed: '2025-06-30T23:59:59.000Z',
        updatedAt: '2025-07-01T00:00:00.000Z',
        attemptDistribution: {
          1: 40,
          2: 50,
          3: 35,
          4: 25,
          5: 10,
          6: 0,
        },
        difficultyScore: 3.2,
      };

      expect(detailedRecord.attemptDistribution?.[1]).toBe(40);
      expect(detailedRecord.attemptDistribution?.[6]).toBe(0);
      expect(detailedRecord.difficultyScore).toBe(3.2);
    });
  });
});

describe('Word Entity Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up mock for generateWordId
    const mockGeneratorFn = jest.fn().mockReturnValue('test1234');
    mockCustomAlphabet.mockReturnValue(mockGeneratorFn);
  });

  describe('createWordEntity', () => {
    it('should create word entity with generated ID', () => {
      const word = 'つきあかり';
      const entity = createWordEntity(word);

      expect(entity.word).toBe(word);
      expect(entity.id).toBe('test1234'); // Use mocked ID
      expect(entity.isActive).toBe(true);
      expect(typeof entity.createdAt).toBe('string');

      // Verify createdAt is a valid ISO 8601 timestamp
      const date = new Date(entity.createdAt);
      expect(date.getTime()).not.toBeNaN();
    });

    it('should create word entity with metadata', () => {
      const word = 'さくらんぼ';
      const metadata = {
        difficulty: 'medium' as const,
        category: 'food',
        source: 'dictionary',
      };

      const entity = createWordEntity(word, metadata);

      expect(entity.word).toBe(word);
      expect(entity.id).toBe('test1234'); // Use mocked ID
      expect(entity.metadata).toEqual(metadata);
      expect(entity.metadata?.difficulty).toBe('medium');
      expect(entity.metadata?.category).toBe('food');
    });

    it('should generate different IDs for different entities', () => {
      // Mock different IDs for different calls
      const mockGeneratorFn = jest
        .fn()
        .mockReturnValueOnce('abcd1234')
        .mockReturnValueOnce('efgh5678');
      mockCustomAlphabet.mockReturnValue(mockGeneratorFn);

      const entity1 = createWordEntity('ひまわり');
      const entity2 = createWordEntity('きらきら');

      expect(entity1.id).toBe('abcd1234');
      expect(entity2.id).toBe('efgh5678');
      expect(entity1.id).not.toBe(entity2.id);
    });
  });

  describe('isValidWordEntity', () => {
    it('should return true for valid word entity', () => {
      const validEntity = {
        id: 'abcd1234',
        word: 'つきあかり',
        createdAt: '2025-06-10T08:30:00.000Z',
        isActive: true,
      };

      expect(isValidWordEntity(validEntity)).toBe(true);
    });

    it('should return true for valid entity with metadata', () => {
      const validEntityWithMeta = {
        id: 'efgh5678',
        word: 'さくらんぼ',
        createdAt: '2025-06-10T08:30:00.000Z',
        isActive: true,
        metadata: {
          difficulty: 'medium',
          category: 'food',
        },
      };

      expect(isValidWordEntity(validEntityWithMeta)).toBe(true);
    });

    it('should return false for invalid ID length', () => {
      const invalidEntity = {
        id: 'abc123', // Too short
        word: 'つきあかり',
        createdAt: '2025-06-10T08:30:00.000Z',
        isActive: true,
      };

      expect(isValidWordEntity(invalidEntity)).toBe(false);
    });

    it('should return false for invalid word length', () => {
      const invalidEntity = {
        id: 'abcd1234',
        word: 'つき', // Too short
        createdAt: '2025-06-10T08:30:00.000Z',
        isActive: true,
      };

      expect(isValidWordEntity(invalidEntity)).toBe(false);
    });

    it('should return false for non-hiragana word', () => {
      const invalidEntity = {
        id: 'abcd1234',
        word: 'hello', // Not hiragana
        createdAt: '2025-06-10T08:30:00.000Z',
        isActive: true,
      };

      expect(isValidWordEntity(invalidEntity)).toBe(false);
    });

    it('should return false for invalid timestamp', () => {
      const invalidEntity = {
        id: 'abcd1234',
        word: 'つきあかり',
        createdAt: 'invalid-date',
        isActive: true,
      };

      expect(isValidWordEntity(invalidEntity)).toBe(false);
    });

    it('should return false for missing required fields', () => {
      expect(isValidWordEntity({})).toBe(false);
      expect(isValidWordEntity(null)).toBe(false);
      expect(isValidWordEntity(undefined)).toBe(false);
      expect(isValidWordEntity('string')).toBe(false);
    });
  });

  describe('validateWordEntity', () => {
    it('should not throw for valid word entity', () => {
      const validEntity = {
        id: 'abcd1234',
        word: 'つきあかり',
        createdAt: '2025-06-10T08:30:00.000Z',
        isActive: true,
      };

      expect(() => validateWordEntity(validEntity)).not.toThrow();
    });

    it('should throw for invalid word entity', () => {
      const invalidEntity = {
        id: 'abc', // Invalid ID
        word: 'つきあかり',
        createdAt: '2025-06-10T08:30:00.000Z',
        isActive: true,
      };

      expect(() => validateWordEntity(invalidEntity)).toThrow('Invalid word entity');
    });

    it('should throw with helpful error message', () => {
      const invalidEntity = {};

      expect(() => validateWordEntity(invalidEntity)).toThrow(
        'Invalid word entity: must have valid id, word, createdAt, and isActive fields'
      );
    });
  });
});
