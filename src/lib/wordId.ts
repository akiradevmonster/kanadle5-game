import { customAlphabet } from 'nanoid';

/**
 * Custom alphabet for word IDs: alphanumeric characters only
 * Excludes potentially confusing characters and ensures URL safety
 */
const WORD_ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Length of word IDs (8 characters for good balance of uniqueness and readability)
 */
const WORD_ID_LENGTH = 8;

/**
 * Generates a unique 8-character alphanumeric word ID
 *
 * @returns A unique word ID suitable for Redis keys and URLs
 *
 * @example
 * ```typescript
 * const wordId = generateWordId();
 * console.log(wordId); // "a1B2c3D4"
 * ```
 */
export const generateWordId = (): string => {
  const generateNanoId = customAlphabet(WORD_ID_ALPHABET, WORD_ID_LENGTH);
  return generateNanoId();
};

/**
 * Validates if a string is a valid word ID format
 *
 * @param id The string to validate
 * @returns True if the ID is valid, false otherwise
 *
 * @example
 * ```typescript
 * isValidWordId('abcd1234'); // true
 * isValidWordId('invalid!'); // false
 * isValidWordId('short');    // false
 * ```
 */
export const isValidWordId = (id: unknown): id is string => {
  if (typeof id !== 'string') {
    return false;
  }

  if (id.length !== WORD_ID_LENGTH) {
    return false;
  }

  // Check if all characters are alphanumeric (match our custom alphabet)
  const alphanumericRegex = /^[a-zA-Z0-9]+$/;
  return alphanumericRegex.test(id);
};

/**
 * Validates a word ID and throws an error if invalid
 *
 * @param id The word ID to validate
 * @throws Error if the word ID is invalid
 *
 * @example
 * ```typescript
 * validateWordId('abcd1234'); // No error
 * validateWordId('invalid!'); // Throws Error
 * ```
 */
export const validateWordId = (id: unknown): asserts id is string => {
  if (!isValidWordId(id)) {
    throw new Error('Invalid word ID format: must be 8 alphanumeric characters');
  }
};
