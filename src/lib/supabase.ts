import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// ── 디바이스 ID 관리 ──────────────────────────────────────────
const DEVICE_ID_KEY = 'unse_lab_device_id';

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

// RLS 정책이 x-device-id 헤더로 인증하므로 클라이언트 생성 시 주입
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'x-device-id': getDeviceId(),
    },
  },
});

// ── 사용자 조회/생성 ─────────────────────────────────────────
let cachedUserId: string | null = null;

export async function getOrCreateUser(): Promise<string> {
  if (cachedUserId) return cachedUserId;

  const deviceId = getDeviceId();

  const { data, error } = await supabase
    .from('users')
    .upsert({ device_id: deviceId, last_seen_at: new Date().toISOString() }, {
      onConflict: 'device_id',
    })
    .select('id')
    .single();

  if (error) throw new Error(`사용자 초기화 실패: ${error.message}`);

  cachedUserId = data.id;
  return data.id;
}
