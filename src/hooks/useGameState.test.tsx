import { renderHook, act } from '@testing-library/react';
import { useGameState } from './useGameState';
import type { GuessResult } from '@/types/game';

describe('useGameState', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useGameState());

    expect(result.current.gameState).toEqual({
      currentInput: '',
      currentAttempt: 0,
      gameStatus: 'playing',
      guesses: [],
      guessResults: [],
      isLoading: false,
      error: null,
    });
  });

  it('should update current input', () => {
    const { result } = renderHook(() => useGameState());

    act(() => {
      result.current.updateInput('あいうえお');
    });

    expect(result.current.gameState.currentInput).toBe('あいうえお');
  });

  it('should clear current input', () => {
    const { result } = renderHook(() => useGameState());

    act(() => {
      result.current.updateInput('あいうえお');
      result.current.clearInput();
    });

    expect(result.current.gameState.currentInput).toBe('');
  });

  it('should add a guess with result', () => {
    const { result } = renderHook(() => useGameState());
    const guess = 'さくらもち';
    const guessResult: GuessResult = ['absent', 'correct', 'absent', 'present', 'correct'];

    act(() => {
      result.current.addGuess(guess, guessResult);
    });

    expect(result.current.gameState.guesses).toEqual([guess]);
    expect(result.current.gameState.guessResults).toEqual([guessResult]);
    expect(result.current.gameState.currentAttempt).toBe(1);
    expect(result.current.gameState.currentInput).toBe('');
  });

  it('should update game status', () => {
    const { result } = renderHook(() => useGameState());

    act(() => {
      result.current.updateGameStatus('won');
    });

    expect(result.current.gameState.gameStatus).toBe('won');
  });

  it('should set loading state', () => {
    const { result } = renderHook(() => useGameState());

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.gameState.isLoading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });

    expect(result.current.gameState.isLoading).toBe(false);
  });

  it('should set error message', () => {
    const { result } = renderHook(() => useGameState());
    const errorMessage = '辞書に存在しない単語です';

    act(() => {
      result.current.setError(errorMessage);
    });

    expect(result.current.gameState.error).toBe(errorMessage);
  });

  it('should clear error message', () => {
    const { result } = renderHook(() => useGameState());

    act(() => {
      result.current.setError('エラーメッセージ');
      result.current.clearError();
    });

    expect(result.current.gameState.error).toBeNull();
  });

  it('should reset game state', () => {
    const { result } = renderHook(() => useGameState());

    // Set up some state
    act(() => {
      result.current.updateInput('あいうえお');
      result.current.addGuess('さくらもち', ['absent', 'correct', 'absent', 'present', 'correct']);
      result.current.updateGameStatus('won');
      result.current.setError('エラー');
    });

    // Reset
    act(() => {
      result.current.resetGame();
    });

    expect(result.current.gameState).toEqual({
      currentInput: '',
      currentAttempt: 0,
      gameStatus: 'playing',
      guesses: [],
      guessResults: [],
      isLoading: false,
      error: null,
    });
  });

  it('should determine game over when reaching max attempts', () => {
    const { result } = renderHook(() => useGameState());
    const guessResult: GuessResult = ['absent', 'absent', 'absent', 'absent', 'absent'];

    // Add 8 failed guesses
    act(() => {
      for (let i = 0; i < 8; i++) {
        result.current.addGuess(`guess${i}`, guessResult);
      }
    });

    expect(result.current.gameState.currentAttempt).toBe(8);
    expect(result.current.gameState.gameStatus).toBe('lost');
  });

  it('should detect win condition', () => {
    const { result } = renderHook(() => useGameState());
    const winningResult: GuessResult = ['correct', 'correct', 'correct', 'correct', 'correct'];

    act(() => {
      result.current.addGuess('せいかい！', winningResult);
    });

    expect(result.current.gameState.gameStatus).toBe('won');
  });
});
