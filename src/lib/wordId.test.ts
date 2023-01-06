// Mock nanoid before importing
jest.mock('nanoid', () => ({
  nanoid: jest.fn(),
  customAlphabet: jest.fn(),
}));

import { customAlphabet } from 'nanoid';
import { generateWordId, isValidWordId, validateWordId } from './wordId';

const mockCustomAlphabet = customAlphabet as jest.MockedFunction<typeof customAlphabet>;

describe('Word ID Generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateWordId', () => {
    it('should generate 8-character ID using custom alphabet', () => {
      const mockGeneratorFn = jest.fn().mockReturnValue('abcd1234');
      mockCustomAlphabet.mockReturnValue(mockGeneratorFn);

      const wordId = generateWordId();

      expect(mockCustomAlphabet).toHaveBeenCalledWith(
        '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
        8
      );
      expect(mockGeneratorFn).toHaveBeenCalledTimes(1);
      expect(wordId).toBe('abcd1234');
    });

    it('should generate different IDs on multiple calls', () => {
      const mockGeneratorFn = jest
        .fn()
        .mockReturnValueOnce('abcd1234')
        .mockReturnValueOnce('efgh5678');
      mockCustomAlphabet.mockReturnValue(mockGeneratorFn);

      const id1 = generateWordId();
      const id2 = generateWordId();

      expect(id1).toBe('abcd1234');
      expect(id2).toBe('efgh5678');
      expect(mockGeneratorFn).toHaveBeenCalledTimes(2);
    });

    it('should use alphanumeric characters only', () => {
      const mockGeneratorFn = jest.fn().mockReturnValue('Z9a1B2c3');
      mockCustomAlphabet.mockReturnValue(mockGeneratorFn);

      const wordId = generateWordId();

      // Verify custom alphabet contains only alphanumeric characters
      const expectedAlphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      expect(mockCustomAlphabet).toHaveBeenCalledWith(expectedAlphabet, 8);
      expect(wordId).toBe('Z9a1B2c3');
    });
  });

  describe('isValidWordId', () => {
    it('should return true for valid 8-character alphanumeric ID', () => {
      expect(isValidWordId('abcd1234')).toBe(true);
      expect(isValidWordId('ABCD1234')).toBe(true);
      expect(isValidWordId('aB1c2D3e')).toBe(true);
      expect(isValidWordId('12345678')).toBe(true);
      expect(isValidWordId('abcdefgh')).toBe(true);
      expect(isValidWordId('ABCDEFGH')).toBe(true);
    });

    it('should return false for invalid length', () => {
      expect(isValidWordId('abcd123')).toBe(false); // 7 characters
      expect(isValidWordId('abcd12345')).toBe(false); // 9 characters
      expect(isValidWordId('')).toBe(false); // empty
      expect(isValidWordId('a')).toBe(false); // 1 character
    });

    it('should return false for non-alphanumeric characters', () => {
      expect(isValidWordId('abcd123-')).toBe(false); // hyphen
      expect(isValidWordId('abcd123_')).toBe(false); // underscore
      expect(isValidWordId('abcd123!')).toBe(false); // exclamation
      expect(isValidWordId('abcd123@')).toBe(false); // at sign
      expect(isValidWordId('abcd 123')).toBe(false); // space
    });

    it('should return false for null or undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isValidWordId(null as any)).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isValidWordId(undefined as any)).toBe(false);
    });
  });

  describe('validateWordId', () => {
    it('should not throw for valid word ID', () => {
      expect(() => validateWordId('abcd1234')).not.toThrow();
      expect(() => validateWordId('ABCD1234')).not.toThrow();
      expect(() => validateWordId('aB1c2D3e')).not.toThrow();
    });

    it('should throw error for invalid length', () => {
      expect(() => validateWordId('abcd123')).toThrow('Invalid word ID format');
      expect(() => validateWordId('abcd12345')).toThrow('Invalid word ID format');
      expect(() => validateWordId('')).toThrow('Invalid word ID format');
    });

    it('should throw error for non-alphanumeric characters', () => {
      expect(() => validateWordId('abcd123-')).toThrow('Invalid word ID format');
      expect(() => validateWordId('abcd123_')).toThrow('Invalid word ID format');
      expect(() => validateWordId('abcd 123')).toThrow('Invalid word ID format');
    });

    it('should throw error for null or undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => validateWordId(null as any)).toThrow('Invalid word ID format');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => validateWordId(undefined as any)).toThrow('Invalid word ID format');
    });

    it('should include helpful error message', () => {
      expect(() => validateWordId('invalid!')).toThrow(
        'Invalid word ID format: must be 8 alphanumeric characters'
      );
    });
  });

  describe('Word ID format requirements', () => {
    it('should meet Redis key requirements', () => {
      const mockGeneratorFn = jest.fn().mockReturnValue('test1234');
      mockCustomAlphabet.mockReturnValue(mockGeneratorFn);

      const wordId = generateWordId();

      // Should be suitable for Redis keys
      expect(wordId).toMatch(/^[a-zA-Z0-9]{8}$/);
      expect(wordId.length).toBe(8);
    });

    it('should be URL-safe', () => {
      const mockGeneratorFn = jest.fn().mockReturnValue('URL12345');
      mockCustomAlphabet.mockReturnValue(mockGeneratorFn);

      const wordId = generateWordId();

      // Should not contain URL-unsafe characters
      expect(wordId).not.toMatch(/[^a-zA-Z0-9]/);
    });

    it('should be case-sensitive and distinct', () => {
      expect(isValidWordId('abcdefgh')).toBe(true);
      expect(isValidWordId('ABCDEFGH')).toBe(true);
      // These should be considered different valid IDs
      expect('abcdefgh').not.toBe('ABCDEFGH');
    });
  });
});
