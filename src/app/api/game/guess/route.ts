import { NextRequest, NextResponse } from 'next/server';
import { submitGuess } from '@/lib/game/gameService';
import wordsData from '@/data/words.json';
import type { WordEntry } from '@/types/words';

// Use word list as WordEntry array
const wordList = wordsData as WordEntry[];

/**
 * POST /api/game/guess
 * Submit a guess and get evaluation result
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { guess, gameDate } = body;

    // Validate input
    if (!guess || typeof guess !== 'string') {
      return NextResponse.json({ error: '推測する単語が必要です' }, { status: 400 });
    }

    if (!gameDate || typeof gameDate !== 'string') {
      return NextResponse.json({ error: 'ゲーム日付が必要です' }, { status: 400 });
    }

    // Validate date format (YYYY-MM-DD)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(gameDate)) {
      return NextResponse.json({ error: '無効な日付形式です' }, { status: 400 });
    }

    // Submit guess
    const result = await submitGuess(guess, gameDate, wordList);

    if (result.success) {
      return NextResponse.json({
        result: result.result,
        gameStatus: result.isWin ? 'won' : 'playing',
        attemptCount: 0, // This would need to be tracked with session/database
      });
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in /api/game/guess:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
