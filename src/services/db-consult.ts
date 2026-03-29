import { supabase, getOrCreateUser } from '../lib/supabase';
import type { ConsultResult } from './consult';

interface ConsultBirthday {
  year: number;
  month: number;
  day: number;
  hour?: number;
  gender?: 'male' | 'female';
}

// ── AI 상담 질문 저장 ─────────────────────────────────────────
// 세션 생성 후 메시지(질문+답변) 저장, 세션 id 반환
export async function saveConsultMessage(
  question: string,
  result: ConsultResult,
  birthday?: ConsultBirthday,
  paymentId?: string,
  aiModel?: string,
): Promise<string | null> {
  const userId = await getOrCreateUser();

  // 1. 세션 생성
  const { data: session, error: sessionError } = await supabase
    .from('consult_sessions')
    .insert({
      user_id:     userId,
      birth_year:  birthday?.year   ?? null,
      birth_month: birthday?.month  ?? null,
      birth_day:   birthday?.day    ?? null,
      birth_hour:  birthday?.hour   ?? null,
      gender:      birthday?.gender ?? null,
      is_paid:     !!paymentId,
      payment_id:  paymentId ?? null,
    })
    .select('id')
    .single();

  if (sessionError) {
    console.warn('[DB] 상담 세션 생성 실패:', sessionError.message);
    return null;
  }

  // 2. 메시지 저장
  const { error: msgError } = await supabase
    .from('consult_messages')
    .insert({
      session_id:   session.id,
      question,
      free_answer:  result.free,
      paid_answer:  result.paid  ?? null,
      bullets:      result.bullets ?? null,
      ai_model:     aiModel ?? null,
    });

  if (msgError) {
    console.warn('[DB] 상담 메시지 저장 실패:', msgError.message);
  }

  return session.id;
}

// ── 상담 내역 조회 (마이페이지용) ─────────────────────────────
export async function getConsultHistory(limit = 20): Promise<Array<{
  sessionId: string;
  question: string;
  freeAnswer: string;
  isPaid: boolean;
  createdAt: string;
}>> {
  const userId = await getOrCreateUser();

  const { data, error } = await supabase
    .from('consult_sessions')
    .select(`
      id,
      is_paid,
      created_at,
      consult_messages ( question, free_answer )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('[DB] 상담 내역 조회 실패:', error.message);
    return [];
  }

  return (data ?? []).flatMap((session: any) =>
    (session.consult_messages ?? []).map((msg: any) => ({
      sessionId:   session.id,
      question:    msg.question,
      freeAnswer:  msg.free_answer,
      isPaid:      session.is_paid,
      createdAt:   session.created_at,
    }))
  );
}
