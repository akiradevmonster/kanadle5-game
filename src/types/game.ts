/**
 * Type definitions for game logic
 *
 * This file contains type definitions for the core game mechanics
 * including guess evaluation results and game state management.
 */

/**
 * Result of evaluating a single character in a guess
 * - 'correct': Character is in the correct position
 * - 'present': Character exists in the word but in wrong position
 * - 'absent': Character does not exist in the word
 */
export type CharacterResult = 'correct' | 'present' | 'absent';

/**
 * Result of evaluating an entire guess (array of character results)
 */
export type GuessResult = CharacterResult[];

/**
 * Game status
 */
export type GameStatus = 'playing' | 'won' | 'lost';

/**
 * Client-side game state (without sensitive information)
 */
export type ClientGameState = {
  // UI state
  currentInput: string;
  currentAttempt: number; // 0-7
  gameStatus: GameStatus;

  // Display history (without correct answer)
  guesses: string[];
  guessResults: GuessResult[];

  // UI control
  isLoading: boolean;
  error: string | null;
};

/**
 * Server-side game state (with sensitive information)
 */
export type ServerGameState = {
  // Secure information
  targetWord: string; // Must be kept secret
  gameDate: string; // 'YYYY-MM-DD'

  // Persistent data
  userId?: string; // LINE user ID
  attempts: string[];
  completedAt?: Date;
  isCompleted: boolean;
  attemptCount: number;
};
