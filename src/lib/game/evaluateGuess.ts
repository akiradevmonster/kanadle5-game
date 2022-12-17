import type { CharacterResult, GuessResult } from '@/types/game';

export function evaluateGuess(guess: string, targetWord: string): GuessResult {
  const guessChars = [...guess];
  const targetChars = [...targetWord];

  // Step 1: Count occurrences of each character in target word
  const targetCharCount: Record<string, number> = {};
  for (const char of targetChars) {
    targetCharCount[char] = (targetCharCount[char] || 0) + 1;
  }

  // Initialize result array with 'absent' as default
  const result: CharacterResult[] = new Array(guessChars.length).fill('absent');

  // Step 2: First pass - mark correct positions
  for (const [index, guessChar] of guessChars.entries()) {
    if (guessChar === targetChars[index]) {
      result[index] = 'correct';
      targetCharCount[guessChar]--;
    }
  }

  // Step 3: Second pass - mark present (left to right)
  for (const [index, guessChar] of guessChars.entries()) {
    if (result[index] !== 'correct' && targetCharCount[guessChar] > 0) {
      result[index] = 'present';
      targetCharCount[guessChar]--;
    }
  }

  return result;
}
