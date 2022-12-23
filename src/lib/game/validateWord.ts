import type { WordEntry } from '@/types/words';

/**
 * Validates if a word is valid for the game
 *
 * Rules:
 * 1. Must be exactly 5 characters
 * 2. Must contain only basic hiragana characters (あ-ん)
 * 3. Must exist in the dictionary
 *
 * @param word - The word to validate
 * @param dictionary - Array of valid word entries
 * @returns true if the word is valid, false otherwise
 */
export function validateWord(word: string, dictionary: WordEntry[]): boolean {
  // Null/undefined check
  if (!word || !dictionary) {
    return false;
  }

  // Length check - must be exactly 5 characters
  if (word.length !== 5) {
    return false;
  }

  // Check if all characters are basic hiragana
  // Basic hiragana range: \u3042-\u3093 (あ-ん)
  // Excluding obsolete characters ゐ(\u3090) and ゑ(\u3091)
  // Excluding を(\u3092) as per game rules
  const isBasicHiragana = /^[\u3042-\u308F\u3093]+$/.test(word);
  if (!isBasicHiragana) {
    return false;
  }

  // Additional check to exclude 'を'
  if (word.includes('を')) {
    return false;
  }

  // Check if word exists in dictionary
  return dictionary.some(entry => entry.kana === word);
}
