/**
 * Type definitions for the word list file
 *
 * This file provides type definitions for the 5-character hiragana word list
 * used in the Kanadle5 Game (Kanadoru5).
 *
 * @see System Patterns Data Model 1: Word Dictionary
 */

/**
 * Word entry type definition
 *
 * @property kana - 5-character hiragana word (used for game challenges and answers)
 * @property word - Corresponding kanji/katakana representation (for display)
 */
export interface WordEntry {
  /** 5-character hiragana word */
  kana: string;

  /** Kanji/katakana representation */
  word: string;
}

/**
 * Word list type definition
 *
 * Type definition for the word list file (src/data/words.json).
 * Represented as an array of WordEntry objects.
 */
export type WordList = WordEntry[];

/**
 * Word validation function type definition
 *
 * @param word - The word to validate
 * @returns true if the word is valid, false otherwise
 */
export type WordValidator = (word: string) => boolean;
