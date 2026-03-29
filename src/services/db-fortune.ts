import { supabase, getOrCreateUser } from '../lib/supabase';
import type { FortuneResult } from './fortune';

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── 오늘의 운세 캐시 조회 ─────────────────────────────────────
// 같은 날 + 같은 생년월일 + 같은 유저면 DB에서 바로 반환 (AI 호출 생략)
export async function getFortuneFromDB(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
): Promise<FortuneResult | null> {
  const userId = await getOrCreateUser();
  const today = getTodayDate();

  const { data, error } = await supabase
    .from('fortune_readings')
    .select('*')
    .eq('user_id', userId)
    .eq('birth_year', birthYear)
    .eq('birth_month', birthMonth)
    .eq('birth_day', birthDay)
    .eq('reading_date', today)
    .maybeSingle();

  if (error) {
    console.warn('[DB] 운세 조회 실패:', error.message);
    return null;
  }
  if (!data) return null;

  return {
    overall: { score: data.overall_score, message: data.overall_message },
    love:    { score: data.love_score,    message: data.love_message },
    money:   { score: data.money_score,   message: data.money_message },
    health:  { score: data.health_score,  message: data.health_message },
    luck:    { score: data.luck_score,    message: data.luck_message },
    detail:      data.detail,
    luckyItem:   data.lucky_item,
    luckyColor:  data.lucky_color,
    luckyNumber: data.lucky_number,
    advice:      data.advice,
  };
}

// ── 오늘의 운세 저장 ──────────────────────────────────────────
export async function saveFortuneResult(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  result: FortuneResult,
  aiModel?: string,
): Promise<void> {
  const userId = await getOrCreateUser();
  const today = getTodayDate();

  const { error } = await supabase
    .from('fortune_readings')
    .upsert({
      user_id:         userId,
      birth_year:      birthYear,
      birth_month:     birthMonth,
      birth_day:       birthDay,
      reading_date:    today,
      overall_score:   result.overall.score,
      overall_message: result.overall.message,
      love_score:      result.love.score,
      love_message:    result.love.message,
      money_score:     result.money.score,
      money_message:   result.money.message,
      health_score:    result.health.score,
      health_message:  result.health.message,
      luck_score:      result.luck.score,
      luck_message:    result.luck.message,
      detail:          result.detail,
      lucky_item:      result.luckyItem,
      lucky_color:     result.luckyColor,
      lucky_number:    result.luckyNumber,
      advice:          result.advice,
      ai_model:        aiModel ?? null,
    }, {
      onConflict: 'user_id,birth_year,birth_month,birth_day,reading_date',
    });

  if (error) console.warn('[DB] 운세 저장 실패:', error.message);
}
