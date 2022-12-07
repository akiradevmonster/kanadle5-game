'use client';

import React, { useCallback } from 'react';
import { GameBoard, HiraganaKeyboard } from '@/components';
import { useGameState } from '@/hooks';
import type { CharacterResult } from '@/types/game';

type CharacterState = 'default' | 'correct' | 'present' | 'absent';

export default function Home() {
  const { gameState, updateInput, addGuess, setLoading, setError, clearError } = useGameState();

  /**
   * Submit guess to API
   */
  const submitGuess = useCallback(
    async (guess: string) => {
      setLoading(true);
      clearError();

      try {
        const response = await fetch('/api/game/guess', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            guess,
            gameDate: new Date().toISOString().split('T')[0],
          }),
        });

        const data = await response.json();

        if (response.ok) {
          addGuess(guess, data.result);
        } else {
          setError(data.error || 'エラーが発生しました');
        }
      } catch (error) {
        console.error('Error submitting guess:', error);
        setError('ネットワークエラーが発生しました');
      } finally {
        setLoading(false);
      }
    },
    [addGuess, setLoading, setError, clearError]
  );

  /**
   * Generate character states for keyboard feedback
   */
  const generateCharacterStates = useCallback((): Record<string, CharacterState> => {
    const states: Record<string, CharacterState> = {};

    gameState.guessResults.forEach((result, guessIndex) => {
      const guess = gameState.guesses[guessIndex];
      result.forEach((charResult: CharacterResult, charIndex) => {
        const character = guess[charIndex];
        if (character) {
          // Use the most informative state (correct > present > absent)
          const currentState = states[character];
          if (
            !currentState ||
            charResult === 'correct' ||
            (charResult === 'present' && currentState === 'absent')
          ) {
            states[character] = charResult as CharacterState;
          }
        }
      });
    });

    return states;
  }, [gameState.guesses, gameState.guessResults]);

  /**
   * Handle character input from keyboard
   */
  const handleKeyPress = useCallback(
    (character: string) => {
      if (gameState.currentInput.length < 5 && gameState.gameStatus === 'playing') {
        updateInput(gameState.currentInput + character);
      }
    },
    [gameState.currentInput, gameState.gameStatus, updateInput]
  );

  /**
   * Handle backspace from keyboard
   */
  const handleBackspace = useCallback(() => {
    if (gameState.currentInput.length > 0) {
      updateInput(gameState.currentInput.slice(0, -1));
    }
  }, [gameState.currentInput, updateInput]);

  /**
   * Handle enter from keyboard
   */
  const handleEnter = useCallback(async () => {
    if (
      gameState.currentInput.length === 5 &&
      gameState.gameStatus === 'playing' &&
      !gameState.isLoading
    ) {
      await submitGuess(gameState.currentInput);
    }
  }, [gameState.currentInput, gameState.gameStatus, gameState.isLoading, submitGuess]);

  const characterStates = generateCharacterStates();
  const isDisabled = gameState.gameStatus !== 'playing' || gameState.isLoading;

  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-4 pb-8 gap-8 sm:p-8 font-[family-name:var(--font-geist-sans)]">
      <header className="w-full text-center py-4">
        <h1 className="text-3xl font-bold">Kanadle5</h1>
      </header>
      <main className="flex flex-col items-center justify-center w-full gap-8">
        <GameBoard gameState={gameState} />

        {/* Current input display */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Current Input:</p>
          <div className="text-2xl font-mono border-2 border-gray-300 rounded px-4 py-2 min-w-[200px] bg-gray-50">
            {gameState.currentInput || '・・・・・'}
          </div>

          {/* Game progress info */}
          <div className="mt-2 text-sm text-gray-500">
            試行回数: {gameState.currentAttempt}/8
            {gameState.isLoading && <span className="ml-2">処理中...</span>}
          </div>
        </div>

        <HiraganaKeyboard
          onKeyPress={handleKeyPress}
          onBackspace={handleBackspace}
          onEnter={handleEnter}
          characterStates={characterStates}
          disabled={isDisabled}
        />
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center p-4 text-sm text-gray-500">
        <p>© 2025 Kanadle5 Game</p>
      </footer>
    </div>
  );
}
