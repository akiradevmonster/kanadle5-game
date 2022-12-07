import React from 'react';
import type { ClientGameState, CharacterResult } from '@/types/game';

/**
 * Props for GameBoard component
 */
type GameBoardProps = {
  gameState: ClientGameState;
};

/**
 * Get background color class based on character result
 */
function getBackgroundColor(result?: CharacterResult): string {
  switch (result) {
    case 'correct':
      return 'bg-green-500 text-white';
    case 'present':
      return 'bg-yellow-500 text-white';
    case 'absent':
      return 'bg-gray-500 text-white';
    default:
      return 'bg-white';
  }
}

/**
 * GameBoard component for Kanadle5 game
 * Displays a 8x5 grid for the word guessing game
 */
const GameBoard: React.FC<GameBoardProps> = ({ gameState }) => {
  const rows = 8;
  const cols = 5;

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-6">Kanadle5</h2>
      <div className="game-board">
        {Array(rows)
          .fill(null)
          .map((_, rowIndex) => {
            const guess = gameState.guesses[rowIndex];
            const guessResult = gameState.guessResults[rowIndex];
            const isCurrentRow = rowIndex === gameState.currentAttempt;

            return (
              <div key={`row-${rowIndex}`} className="flex mb-2">
                {Array(cols)
                  .fill(null)
                  .map((_, colIndex) => {
                    let character = '';
                    let bgColor = 'bg-white';

                    if (guess) {
                      // Show completed guess
                      character = guess[colIndex] || '';
                      bgColor = getBackgroundColor(guessResult?.[colIndex]);
                    } else if (isCurrentRow && gameState.gameStatus === 'playing') {
                      // Show current input
                      character = gameState.currentInput[colIndex] || '';
                    }

                    return (
                      <div
                        key={`cell-${rowIndex}-${colIndex}`}
                        className={`w-12 h-12 border-2 border-gray-300 rounded mx-1 flex items-center justify-center text-xl font-bold transition-colors ${bgColor}`}
                      >
                        {character}
                      </div>
                    );
                  })}
              </div>
            );
          })}
      </div>

      {/* Game status messages */}
      {gameState.gameStatus === 'won' && (
        <div className="mt-4 text-green-600 font-bold text-lg">
          おめでとうございます！正解です！
        </div>
      )}
      {gameState.gameStatus === 'lost' && (
        <div className="mt-4 text-red-600 font-bold text-lg">残念！次回がんばってください！</div>
      )}
      {gameState.error && <div className="mt-4 text-red-500 text-sm">{gameState.error}</div>}
    </div>
  );
};

export default GameBoard;
