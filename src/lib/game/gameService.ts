import { validateWord } from './validateWord';
import { evaluateGuess } from './evaluateGuess';
import { getDailyWord } from './getDailyWord';
import type { GuessResult } from '@/types/game';
import type { WordEntry } from '@/types/words';

/**
 * Submit a guess and get evaluation result
 * @param guess The guessed word
 * @param gameDate The game date (YYYY-MM-DD format)
 * @param wordList The word list for validation (array of WordEntry objects)
 * @returns Success with result or error
 */
export async function submitGuess(
  guess: string,
  gameDate: string,
  wordList: WordEntry[]
): Promise<
  { success: true; result: GuessResult; isWin: boolean } | { success: false; error: string }
> {
  try {
    // Validate the word
    const isValid = validateWord(guess, wordList);
    if (!isValid) {
      return {
        success: false,
        error: '辞書に存在しない単語です',
      };
    }

    // Get the daily word
    const targetWord = await getDailyWord(new Date(gameDate));

    // Evaluate the guess
    const result = evaluateGuess(guess, targetWord);

    // Check win condition
    const isWin = result.every(r => r === 'correct');

    return {
      success: true,
      result,
      isWin,
    };
  } catch (error) {
    console.error('Error in submitGuess:', error);
    return {
      success: false,
      error: 'エラーが発生しました',
    };
  }
}

/**
 * Get the daily game state without revealing the target word
 * @param gameDate The game date (YYYY-MM-DD format)
 * @returns Daily game state
 */
export async function getDailyGameState(gameDate: string): Promise<{
  gameDate: string;
  isActive: boolean;
  currentAttempt: number;
  maxAttempts: number;
}> {
  // Verify that we can get a daily word (throws if not)
  await getDailyWord(new Date(gameDate));

  return {
    gameDate,
    isActive: true,
    currentAttempt: 0,
    maxAttempts: 8,
  };
}
