import { validateWord } from './validateWord';
import type { WordEntry } from '@/types/words';

describe('validateWord', () => {
  const validDictionary: WordEntry[] = [
    { kana: 'あいうえお', word: 'アイウエオ' },
    { kana: 'かきくけこ', word: 'カキクケコ' },
    { kana: 'さしすせそ', word: 'サシスセソ' },
    { kana: 'たちつてと', word: 'タチツテト' },
    { kana: 'なにぬねの', word: 'ナニヌネノ' },
    { kana: 'はひふへほ', word: 'ハヒフヘホ' },
    { kana: 'まみむめも', word: 'マミムメモ' },
    { kana: 'やいゆえよ', word: 'ヤイユエヨ' },
    { kana: 'らりるれろ', word: 'ラリルレロ' },
    { kana: 'わいうえん', word: 'ワイウエン' },
  ];

  describe('Valid word cases', () => {
    it('should return true for a valid 5-character basic hiragana word in dictionary', () => {
      expect(validateWord('あいうえお', validDictionary)).toBe(true);
      expect(validateWord('かきくけこ', validDictionary)).toBe(true);
      expect(validateWord('さしすせそ', validDictionary)).toBe(true);
    });

    it('should validate all basic hiragana characters', () => {
      const comprehensiveDictionary: WordEntry[] = [
        { kana: 'あかさたな', word: 'アカサタナ' },
        { kana: 'はまやらわ', word: 'ハマヤラワ' },
        { kana: 'いきしちに', word: 'イキシチニ' },
        { kana: 'ひみりをん', word: 'ヒミリヲン' },
      ];

      expect(validateWord('あかさたな', comprehensiveDictionary)).toBe(true);
      expect(validateWord('はまやらわ', comprehensiveDictionary)).toBe(true);
    });
  });

  describe('Invalid word cases', () => {
    it('should return false for words not in dictionary', () => {
      expect(validateWord('ばびぶべぼ', validDictionary)).toBe(false);
      expect(validateWord('ぱぴぷぺぽ', validDictionary)).toBe(false);
    });

    it('should return false for words with incorrect length', () => {
      expect(validateWord('あいう', validDictionary)).toBe(false); // 3 characters
      expect(validateWord('あいうえ', validDictionary)).toBe(false); // 4 characters
      expect(validateWord('あいうえおか', validDictionary)).toBe(false); // 6 characters
      expect(validateWord('', validDictionary)).toBe(false); // empty
    });

    it('should return false for words with dakuten (濁音)', () => {
      const dictionaryWithoutDakuten: WordEntry[] = [{ kana: 'かきくけこ', word: 'カキクケコ' }];

      expect(validateWord('がぎぐげご', dictionaryWithoutDakuten)).toBe(false);
      expect(validateWord('ざじずぜぞ', dictionaryWithoutDakuten)).toBe(false);
      expect(validateWord('だぢづでど', dictionaryWithoutDakuten)).toBe(false);
      expect(validateWord('ばびぶべぼ', dictionaryWithoutDakuten)).toBe(false);
    });

    it('should return false for words with handakuten (半濁音)', () => {
      expect(validateWord('ぱぴぷぺぽ', validDictionary)).toBe(false);
    });

    it('should return false for words with small characters (拗音)', () => {
      expect(validateWord('きゃくしゃ', validDictionary)).toBe(false);
      expect(validateWord('しゅうりつ', validDictionary)).toBe(false);
      expect(validateWord('ちょうせん', validDictionary)).toBe(false);
    });

    it('should return false for non-hiragana characters', () => {
      expect(validateWord('アイウエオ', validDictionary)).toBe(false); // Katakana
      expect(validateWord('12345', validDictionary)).toBe(false); // Numbers
      expect(validateWord('abcde', validDictionary)).toBe(false); // English
      expect(validateWord('漢字五文字', validDictionary)).toBe(false); // Kanji
      expect(validateWord('あい123', validDictionary)).toBe(false); // Mixed
    });

    it('should return false for words with spaces or special characters', () => {
      expect(validateWord('あい うえ', validDictionary)).toBe(false); // Space
      expect(validateWord('あい　うえ', validDictionary)).toBe(false); // Full-width space
      expect(validateWord('あい・うえ', validDictionary)).toBe(false); // Special character
    });
  });

  describe('Edge cases', () => {
    it('should handle empty dictionary', () => {
      expect(validateWord('あいうえお', [])).toBe(false);
    });

    it('should be case-sensitive for exact match', () => {
      const strictDictionary: WordEntry[] = [{ kana: 'あいうえお', word: 'アイウエオ' }];

      expect(validateWord('あいうえお', strictDictionary)).toBe(true);
      // Different word should not match
      expect(validateWord('あいうえを', strictDictionary)).toBe(false);
    });

    it('should validate basic hiragana characters only', () => {
      // Basic hiragana range: \u3042-\u3093 (あ-ん), excluding を
      const basicHiraganaDictionary: WordEntry[] = [
        { kana: 'あいうえお', word: 'アイウエオ' },
        { kana: 'わいんああ', word: 'ワインアア' }, // ん is valid
      ];

      expect(validateWord('あいうえお', basicHiraganaDictionary)).toBe(true);
      expect(validateWord('わいんああ', basicHiraganaDictionary)).toBe(true);
    });

    it('should reject words containing を character', () => {
      const dictionaryWithWo: WordEntry[] = [
        { kana: 'わをんああ', word: 'ワヲンアア' }, // Dictionary may contain を but validation should reject
      ];

      expect(validateWord('わをんああ', dictionaryWithWo)).toBe(false);
      expect(validateWord('をあいうえ', dictionaryWithWo)).toBe(false);
      expect(validateWord('あいうえを', dictionaryWithWo)).toBe(false);
    });

    it('should handle null or undefined inputs gracefully', () => {
      // TypeScript will enforce types, but good to test runtime behavior
      expect(validateWord(null as unknown as string, validDictionary)).toBe(false);
      expect(validateWord(undefined as unknown as string, validDictionary)).toBe(false);
      expect(validateWord('あいうえお', null as unknown as WordEntry[])).toBe(false);
      expect(validateWord('あいうえお', undefined as unknown as WordEntry[])).toBe(false);
    });
  });
});
