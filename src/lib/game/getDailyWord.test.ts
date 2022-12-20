import { getDailyWord } from './getDailyWord';

describe('getDailyWord', () => {
  it('should return the mock word "つきあかり"', async () => {
    const result = await getDailyWord(new Date());
    expect(result).toBe('つきあかり');
  });

  it('should return the same word for different dates (mock implementation)', async () => {
    const date1 = new Date('2024-01-01');
    const date2 = new Date('2024-12-31');
    const date3 = new Date();

    const word1 = await getDailyWord(date1);
    const word2 = await getDailyWord(date2);
    const word3 = await getDailyWord(date3);

    expect(word1).toBe('つきあかり');
    expect(word2).toBe('つきあかり');
    expect(word3).toBe('つきあかり');
  });

  it('should handle null or undefined dates gracefully', async () => {
    const wordWithNull = await getDailyWord(null as unknown as Date);
    const wordWithUndefined = await getDailyWord(undefined as unknown as Date);

    expect(wordWithNull).toBe('つきあかり');
    expect(wordWithUndefined).toBe('つきあかり');
  });
});
