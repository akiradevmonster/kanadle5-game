import { useState, useCallback } from 'react';
import type { ClientGameState, GuessResult, GameStatus } from '@/types/game';

const MAX_ATTEMPTS = 8;

const initialState: ClientGameState = {
  currentInput: '',
  currentAttempt: 0,
  gameStatus: 'playing',
  guesses: [],
  guessResults: [],
  isLoading: false,
  error: null,
};

export function useGameState() {
  const [gameState, setGameState] = useState<ClientGameState>(initialState);

  const updateInput = useCallback((input: string) => {
    setGameState(prev => ({
      ...prev,
      currentInput: input,
      error: null, // Clear error when typing
    }));
  }, []);

  const clearInput = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentInput: '',
    }));
  }, []);

  const addGuess = useCallback((guess: string, result: GuessResult) => {
    setGameState(prev => {
      const newGuesses = [...prev.guesses, guess];
      const newGuessResults = [...prev.guessResults, result];
      const newAttempt = prev.currentAttempt + 1;

      // Check win condition
      const isWin = result.every(r => r === 'correct');

      // Check lose condition
      const isLose = newAttempt >= MAX_ATTEMPTS && !isWin;

      const newGameStatus: GameStatus = isWin ? 'won' : isLose ? 'lost' : 'playing';

      return {
        ...prev,
        guesses: newGuesses,
        guessResults: newGuessResults,
        currentAttempt: newAttempt,
        currentInput: '',
        gameStatus: newGameStatus,
        error: null,
      };
    });
  }, []);

  const updateGameStatus = useCallback((status: GameStatus) => {
    setGameState(prev => ({
      ...prev,
      gameStatus: status,
    }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setGameState(prev => ({
      ...prev,
      isLoading: loading,
    }));
  }, []);

  const setError = useCallback((error: string) => {
    setGameState(prev => ({
      ...prev,
      error,
    }));
  }, []);

  const clearError = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  const resetGame = useCallback(() => {
    setGameState(initialState);
  }, []);

  return {
    gameState,
    updateInput,
    clearInput,
    addGuess,
    updateGameStatus,
    setLoading,
    setError,
    clearError,
    resetGame,
  };
}
