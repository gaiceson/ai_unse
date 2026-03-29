import { supabase, getOrCreateUser } from '../lib/supabase';
import type { TarotReadingResult, DrawnCard, SpreadType } from './tarot';

// ── 타로 리딩 저장 ─────────────────────────────────────────────
// 카드 데이터(JSONB) + AI 해석을 함께 저장
export async function saveTarotReading(
  question: string,
  spreadType: SpreadType,
  cards: DrawnCard[],
  result: TarotReadingResult,
  aiModel = 'deepseek-chat',
): Promise<void> {
  const userId = await getOrCreateUser();

  const { error } = await supabase
    .from('tarot_readings')
    .insert({
      user_id: userId,
      question,
      spread_type: spreadType,
      cards: cards.map(c => ({
        id: c.id,
        name: c.name,
        nameKo: c.nameKo,
        arcana: c.arcana,
        suit: c.suit ?? null,
        emoji: c.emoji,
        isReversed: c.isReversed,
      })),
      overall:     result.overall,
      action:      result.action    ?? null,
      caution:     result.caution   ?? null,
      timing:      result.timing    ?? null,
      advice:      result.advice,
      key_message: result.keyMessage,
      ai_model:    aiModel,
    });

  if (error) console.warn('[DB] 타로 저장 실패:', error.message);
}

// ── 타로 히스토리 조회 ─────────────────────────────────────────
export async function getTarotHistory(limit = 10): Promise<Array<{
  id: string;
  question: string;
  spreadType: SpreadType;
  cards: DrawnCard[];
  result: TarotReadingResult;
  createdAt: string;
}>> {
  const userId = await getOrCreateUser();

  const { data, error } = await supabase
    .from('tarot_readings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('[DB] 타로 히스토리 조회 실패:', error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    question: row.question,
    spreadType: row.spread_type as SpreadType,
    cards: row.cards as DrawnCard[],
    result: {
      cards:      row.cards.map((c: any, i: number) => ({
        name:           result_card_name(c),
        position:       row.cards[i]?.position ?? '',
        interpretation: '',
      })),
      overall:    row.overall,
      action:     row.action    ?? undefined,
      caution:    row.caution   ?? undefined,
      timing:     row.timing    ?? undefined,
      advice:     row.advice,
      keyMessage: row.key_message,
    } as TarotReadingResult,
    createdAt: row.created_at,
  }));
}

function result_card_name(c: any): string {
  return `${c.nameKo}${c.isReversed ? ' (역방향)' : ''}`;
}
