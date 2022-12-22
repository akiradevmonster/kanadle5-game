import type { ClientGameState, ServerGameState, GuessResult } from '@/types/game';

const MAX_ATTEMPTS = 8;

/**
 * Update client-side game state after a guess
 * @param currentState Current client game state
 * @param guess The guessed word
 * @param result Evaluation result from server
 * @returns Updated client game state
 */
export function updateClientGameState(
  currentState: ClientGameState,
  guess: string,
  result: GuessResult
): ClientGameState {
  // Don't update if game is already finished
  if (currentState.gameStatus !== 'playing') {
    return currentState;
  }

  const newGuesses = [...currentState.guesses, guess];
  const newGuessResults = [...currentState.guessResults, result];
  const newAttempt = currentState.currentAttempt + 1;

  // Check win condition
  const isWin = result.every(r => r === 'correct');

  // Check lose condition
  const isLose = newAttempt >= MAX_ATTEMPTS && !isWin;

  const newGameStatus = isWin ? 'won' : isLose ? 'lost' : 'playing';

  return {
    ...currentState,
    currentInput: '',
    currentAttempt: newAttempt,
    gameStatus: newGameStatus,
    guesses: newGuesses,
    guessResults: newGuessResults,
    error: null,
  };
}

/**
 * Update server-side game state after a guess
 * @param currentState Current server game state
 * @param guess The guessed word
 * @param targetWord The target word (for win detection)
 * @returns Updated server game state
 */
export function updateServerGameState(
  currentState: ServerGameState,
  guess: string,
  targetWord: string
): ServerGameState {
  // Don't update if game is already completed
  if (currentState.isCompleted) {
    return currentState;
  }

  const newAttempts = [...currentState.attempts, guess];
  const newAttemptCount = currentState.attemptCount + 1;

  // Check win condition
  const isWin = guess === targetWord;

  // Check completion condition (win or max attempts reached)
  const isCompleted = isWin || newAttemptCount >= MAX_ATTEMPTS;

  return {
    ...currentState,
    attempts: newAttempts,
    attemptCount: newAttemptCount,
    isCompleted,
    ...(isCompleted ? { completedAt: new Date() } : {}),
  };
}
