import { submitGuess, getDailyGameState } from './gameService';
import { validateWord } from './validateWord';
import { evaluateGuess } from './evaluateGuess';
import { getDailyWord } from './getDailyWord';
import type { GuessResult } from '@/types/game';
import type { WordEntry } from '@/types/words';

// Mock dependencies
jest.mock('./validateWord');
jest.mock('./evaluateGuess');
jest.mock('./getDailyWord');

const mockValidateWord = validateWord as jest.MockedFunction<typeof validateWord>;
const mockEvaluateGuess = evaluateGuess as jest.MockedFunction<typeof evaluateGuess>;
const mockGetDailyWord = getDailyWord as jest.MockedFunction<typeof getDailyWord>;

describe('gameService', () => {
  const mockWordList: WordEntry[] = [
    { kana: 'さくらもち', word: '桜餅' },
    { kana: 'つきあかり', word: '月明かり' },
    { kana: 'ほしぞら', word: '星空' },
    { kana: 'あさひかり', word: '朝日' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('submitGuess', () => {
    it('should return error for invalid word', async () => {
      mockValidateWord.mockReturnValue(false);

      const result = await submitGuess('invalid', '2025-06-06', mockWordList);

      expect(result).toEqual({
        success: false,
        error: '辞書に存在しない単語です',
      });
      expect(mockValidateWord).toHaveBeenCalledWith('invalid', mockWordList);
    });

    it('should return evaluation result for valid word', async () => {
      mockValidateWord.mockReturnValue(true);
      mockGetDailyWord.mockResolvedValue('つきあかり');
      mockEvaluateGuess.mockReturnValue([
        'absent',
        'correct',
        'absent',
        'present',
        'correct',
      ] as GuessResult);

      const result = await submitGuess('さくらもち', '2025-06-06', mockWordList);

      expect(result).toEqual({
        success: true,
        result: ['absent', 'correct', 'absent', 'present', 'correct'],
        isWin: false,
      });
      expect(mockValidateWord).toHaveBeenCalledWith('さくらもち', mockWordList);
      expect(mockGetDailyWord).toHaveBeenCalledWith(new Date('2025-06-06'));
      expect(mockEvaluateGuess).toHaveBeenCalledWith('さくらもち', 'つきあかり');
    });

    it('should detect win condition', async () => {
      mockValidateWord.mockReturnValue(true);
      mockGetDailyWord.mockResolvedValue('つきあかり');
      mockEvaluateGuess.mockReturnValue([
        'correct',
        'correct',
        'correct',
        'correct',
        'correct',
      ] as GuessResult);

      const result = await submitGuess('つきあかり', '2025-06-06', mockWordList);

      expect(result).toEqual({
        success: true,
        result: ['correct', 'correct', 'correct', 'correct', 'correct'],
        isWin: true,
      });
    });

    it('should handle validation error', async () => {
      mockValidateWord.mockImplementation(() => {
        throw new Error('Validation error');
      });

      const result = await submitGuess('error', '2025-06-06', mockWordList);

      expect(result).toEqual({
        success: false,
        error: 'エラーが発生しました',
      });
    });
  });

  describe('getDailyGameState', () => {
    it('should return initial game state for new game', async () => {
      mockGetDailyWord.mockResolvedValue('つきあかり');

      const result = await getDailyGameState('2025-06-06');

      expect(result).toEqual({
        gameDate: '2025-06-06',
        isActive: true,
        currentAttempt: 0,
        maxAttempts: 8,
      });
      expect(mockGetDailyWord).toHaveBeenCalledWith(new Date('2025-06-06'));
    });

    it('should handle word selection error', async () => {
      mockGetDailyWord.mockRejectedValue(new Error('Word selection error'));

      await expect(getDailyGameState('2025-06-06')).rejects.toThrow('Word selection error');
    });
  });
});
