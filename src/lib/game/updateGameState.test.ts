import { updateClientGameState, updateServerGameState } from './updateGameState';
import type { ClientGameState, ServerGameState, GuessResult } from '@/types/game';

describe('updateClientGameState', () => {
  const initialClientState: ClientGameState = {
    currentInput: '',
    currentAttempt: 0,
    gameStatus: 'playing',
    guesses: [],
    guessResults: [],
    isLoading: false,
    error: null,
  };

  it('should add guess and result to state', () => {
    const guess = 'さくらもち';
    const result: GuessResult = ['absent', 'correct', 'absent', 'present', 'correct'];

    const newState = updateClientGameState(initialClientState, guess, result);

    expect(newState.guesses).toEqual([guess]);
    expect(newState.guessResults).toEqual([result]);
    expect(newState.currentAttempt).toBe(1);
    expect(newState.currentInput).toBe('');
  });

  it('should detect win condition', () => {
    const guess = 'せいかい！';
    const result: GuessResult = ['correct', 'correct', 'correct', 'correct', 'correct'];

    const newState = updateClientGameState(initialClientState, guess, result);

    expect(newState.gameStatus).toBe('won');
  });

  it('should detect lose condition after 8 attempts', () => {
    let state = initialClientState;
    const failedResult: GuessResult = ['absent', 'absent', 'absent', 'absent', 'absent'];

    // Make 7 failed attempts
    for (let i = 0; i < 7; i++) {
      state = updateClientGameState(state, `guess${i}`, failedResult);
    }

    // 8th failed attempt should trigger loss
    const finalState = updateClientGameState(state, 'finalguess', failedResult);

    expect(finalState.currentAttempt).toBe(8);
    expect(finalState.gameStatus).toBe('lost');
  });

  it('should clear error and current input on successful guess', () => {
    const stateWithError: ClientGameState = {
      ...initialClientState,
      currentInput: 'input',
      error: 'Some error',
    };

    const newState = updateClientGameState(stateWithError, 'さくらもち', [
      'absent',
      'correct',
      'absent',
      'present',
      'correct',
    ]);

    expect(newState.currentInput).toBe('');
    expect(newState.error).toBeNull();
  });

  it('should not update if game is already finished', () => {
    const wonState: ClientGameState = {
      ...initialClientState,
      gameStatus: 'won',
      currentAttempt: 3,
    };

    const newState = updateClientGameState(wonState, 'newguess', [
      'absent',
      'absent',
      'absent',
      'absent',
      'absent',
    ]);

    // State should remain unchanged
    expect(newState).toEqual(wonState);
  });
});

describe('updateServerGameState', () => {
  const initialServerState: ServerGameState = {
    targetWord: 'つきあかり',
    gameDate: '2025-06-06',
    attempts: [],
    isCompleted: false,
    attemptCount: 0,
  };

  it('should add attempt to server state', () => {
    const guess = 'さくらもち';

    const newState = updateServerGameState(initialServerState, guess, 'つきあかり');

    expect(newState.attempts).toEqual([guess]);
    expect(newState.attemptCount).toBe(1);
  });

  it('should mark as completed on correct guess', () => {
    const correctGuess = 'つきあかり';

    const newState = updateServerGameState(initialServerState, correctGuess, 'つきあかり');

    expect(newState.isCompleted).toBe(true);
    expect(newState.completedAt).toBeDefined();
  });

  it('should mark as completed after 8 failed attempts', () => {
    let state = initialServerState;

    // Make 7 failed attempts
    for (let i = 0; i < 7; i++) {
      state = updateServerGameState(state, `guess${i}`, 'つきあかり');
    }

    // 8th attempt
    const finalState = updateServerGameState(state, 'finalguess', 'つきあかり');

    expect(finalState.attemptCount).toBe(8);
    expect(finalState.isCompleted).toBe(true);
    expect(finalState.completedAt).toBeDefined();
  });

  it('should not update if game is already completed', () => {
    const completedState: ServerGameState = {
      ...initialServerState,
      isCompleted: true,
      attemptCount: 3,
      completedAt: new Date(),
    };

    const newState = updateServerGameState(completedState, 'newguess', 'つきあかり');

    // State should remain unchanged
    expect(newState).toEqual(completedState);
  });

  it('should preserve userId if present', () => {
    const stateWithUser: ServerGameState = {
      ...initialServerState,
      userId: 'LINE_USER_123',
    };

    const newState = updateServerGameState(stateWithUser, 'さくらもち', 'つきあかり');

    expect(newState.userId).toBe('LINE_USER_123');
  });
});
