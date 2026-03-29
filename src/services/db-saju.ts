import { supabase, getOrCreateUser } from '../lib/supabase';
import type { SajuResult } from './saju';

// 시간을 6시간 단위로 버킷: 0-5→0, 6-11→6, 12-17→12, 18-23→18
export function bucketHour(hour: number): number {
  if (hour < 6)  return 0;
  if (hour < 12) return 6;
  if (hour < 18) return 12;
  return 18;
}

// 양력 날짜 + 시간 + 성별 → 캐시 키 (음력은 호출 전에 양력으로 변환)
export function makeSajuKey(
  year: number,
  month: number,
  day: number,
  hour: number,
  gender: 'male' | 'female',
): string {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const hh = String(bucketHour(hour)).padStart(2, '0');
  return `${year}${mm}${dd}${hh}_${gender === 'male' ? 'M' : 'F'}`;
}

// 캐시 조회 (user_id 없음 - 양력 날짜 기준 공유 캐시)
export async function getSajuFromCache(
  year: number,
  month: number,
  day: number,
  hour: number,
  gender: 'male' | 'female',
): Promise<SajuResult | null> {
  const sajuKey = makeSajuKey(year, month, day, hour, gender);

  const { data, error } = await supabase
    .from('fortune_cache')
    .select('ai_result')
    .eq('saju_key', sajuKey)
    .eq('fortune_type', 'premium')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('[Cache] 조회 실패:', error.message);
    return null;
  }
  if (!data) return null;

  // 개인 조회 기록 백그라운드 저장
  logUserReading(sajuKey, 'premium').catch(console.warn);

  return data.ai_result as SajuResult;
}

// 캐시 저장 (upsert - 중복 시 덮어쓰기)
export async function saveSajuToCache(
  year: number,
  month: number,
  day: number,
  hour: number,
  gender: 'male' | 'female',
  result: SajuResult,
): Promise<void> {
  const sajuKey = makeSajuKey(year, month, day, hour, gender);

  const { error } = await supabase
    .from('fortune_cache')
    .upsert(
      { saju_key: sajuKey, fortune_type: 'premium', ai_result: result },
      { onConflict: 'saju_key,fortune_type' },
    );

  if (error) {
    console.warn('[Cache] 저장 실패:', error.message);
    return;
  }

  logUserReading(sajuKey, 'premium').catch(console.warn);
}

// 개인 조회 기록 (AI 결과와 분리)
async function logUserReading(sajuKey: string, fortuneType: string): Promise<void> {
  const userId = await getOrCreateUser();
  await supabase
    .from('user_readings')
    .insert({ user_id: userId, saju_key: sajuKey, fortune_type: fortuneType });
}
