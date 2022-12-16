import { evaluateGuess } from './evaluateGuess';
import type { GuessResult } from '@/types/game';

describe('evaluateGuess', () => {
  describe('basic cases', () => {
    test('evaluates complete match', () => {
      const result: GuessResult = evaluateGuess('あいうえお', 'あいうえお');
      expect(result).toEqual(['correct', 'correct', 'correct', 'correct', 'correct']);
    });

    test('evaluates no duplicates with mixed results', () => {
      const result: GuessResult = evaluateGuess('あいうえお', 'あいえかき');
      expect(result).toEqual(['correct', 'correct', 'absent', 'present', 'absent']);
    });

    test('evaluates all different characters', () => {
      const result: GuessResult = evaluateGuess('あいうえお', 'かきくけこ');
      expect(result).toEqual(['absent', 'absent', 'absent', 'absent', 'absent']);
    });

    test('evaluates all characters present but wrong positions', () => {
      const result: GuessResult = evaluateGuess('あいうえお', 'おえういあ');
      expect(result).toEqual(['present', 'present', 'correct', 'present', 'present']);
    });
  });

  describe('duplicate character handling', () => {
    test('target has 2 same chars, input has 1', () => {
      const result: GuessResult = evaluateGuess('あいうえお', 'ああうえお');
      expect(result).toEqual(['correct', 'absent', 'correct', 'correct', 'correct']);
    });

    test('target has 2 same chars, input has 2 in wrong positions', () => {
      const result: GuessResult = evaluateGuess('ああうえお', 'くけこああ');
      expect(result).toEqual(['present', 'present', 'absent', 'absent', 'absent']);
    });

    test('input has 2 same chars, target has 1', () => {
      const result: GuessResult = evaluateGuess('ああうえお', 'あいうえお');
      expect(result).toEqual(['correct', 'absent', 'correct', 'correct', 'correct']);
    });

    test('complex duplicate pattern from plan', () => {
      const result: GuessResult = evaluateGuess('ここここあ', 'あここうえ');
      expect(result).toEqual(['absent', 'correct', 'correct', 'absent', 'present']);
    });

    test('all same characters match', () => {
      const result: GuessResult = evaluateGuess('ああああ', 'ああああ');
      expect(result).toEqual(['correct', 'correct', 'correct', 'correct']);
    });

    test('wrong position duplicates', () => {
      const result: GuessResult = evaluateGuess('あいあいあ', 'いあいあい');
      expect(result).toEqual(['present', 'present', 'present', 'present', 'absent']);
    });
  });

  describe('left-to-right priority for present status', () => {
    test('leftmost duplicate gets present status first', () => {
      const result: GuessResult = evaluateGuess('ここあねこ', 'ねこねこる');
      expect(result).toEqual(['present', 'correct', 'absent', 'present', 'absent']);
    });

    test('multiple duplicates with limited target count', () => {
      const result: GuessResult = evaluateGuess('あああいい', 'あいあああ');
      expect(result).toEqual(['correct', 'present', 'correct', 'present', 'absent']);
    });

    test('all duplicates as present when none in correct position', () => {
      const result: GuessResult = evaluateGuess('いいいああ', 'あああいい');
      expect(result).toEqual(['present', 'present', 'absent', 'present', 'present']);
    });
  });

  describe('edge cases', () => {
    test('single character words', () => {
      const result: GuessResult = evaluateGuess('あ', 'あ');
      expect(result).toEqual(['correct']);
    });

    test('evaluates katakana as different from hiragana', () => {
      const result: GuessResult = evaluateGuess('あいうえお', 'アイウエオ');
      expect(result).toEqual(['absent', 'absent', 'absent', 'absent', 'absent']);
    });
  });
});
