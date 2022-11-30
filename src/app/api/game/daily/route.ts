import { NextRequest, NextResponse } from 'next/server';
import { getDailyGameState } from '@/lib/game/gameService';

/**
 * GET /api/game/daily
 * Get today's game state (without target word)
 */
export async function GET(request: NextRequest) {
  try {
    // Get gameDate from query params, or use today
    const searchParams = request.nextUrl.searchParams;
    const gameDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Validate date format (YYYY-MM-DD)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(gameDate)) {
      return NextResponse.json({ error: '無効な日付形式です' }, { status: 400 });
    }

    // Get daily game state
    const gameState = await getDailyGameState(gameDate);

    return NextResponse.json(gameState);
  } catch (error) {
    console.error('Error in /api/game/daily:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
