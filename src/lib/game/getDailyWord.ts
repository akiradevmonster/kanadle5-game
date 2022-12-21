/**
 * Mock implementation of getDailyWord function
 * Always returns "つきあかり" for testing purposes
 *
 * TODO: Implement full functionality as described in:
 * .ai-agent/memory-bank/lib/game/getDailyWord.plan.md
 *
 * @param date - The date to get the word for (ignored in mock)
 * @returns Always returns "つきあかり"
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getDailyWord(_date: Date): Promise<string> {
  // Mock implementation - always return the same word
  return 'つきあかり';
}
