import type { BirthdayData } from '../hooks/useStorage';

const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'http://localhost:8787';
const CLIENT_ID = import.meta.env.VITE_TOSS_CLIENT_ID as string;

// 웹 브라우저용 토스 OAuth2 인가 URL (앱 스킴을 통해 토스 앱 실행)
const TOSS_AUTH_BASE = 'https://oauth2.cert.toss.im/authorize';
const SCOPE = 'user_birthday user_gender';

export function getTossAuthUrl(): string {
  const redirectUri = getTossRedirectUri();
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    scope: SCOPE,
  });
  return `${TOSS_AUTH_BASE}?${params.toString()}`;
}

export function getTossRedirectUri(): string {
  return `${window.location.origin}/auth/toss/callback`;
}

export interface TossLoginResult {
  userKey: string;
  birthday: BirthdayData;
}

export async function exchangeTossCode(authorizationCode: string, ref?: string): Promise<TossLoginResult> {
  const referrer = ref ?? getTossRedirectUri();

  const res = await fetch(`${WORKER_URL}/api/toss/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authorizationCode, referrer }),
  });

  const data = await res.json() as {
    userKey?: string;
    birthday?: string; // yyyyMMdd
    gender?: string;   // MALE | FEMALE
    error?: string;
  };

  if (!res.ok || !data.birthday || !data.userKey) {
    throw new Error(data.error || '토스 로그인에 실패했어요.');
  }

  // yyyyMMdd → BirthdayData
  const raw = data.birthday;
  const year = parseInt(raw.slice(0, 4), 10);
  const month = parseInt(raw.slice(4, 6), 10);
  const day = parseInt(raw.slice(6, 8), 10);
  const gender: 'male' | 'female' | undefined =
    data.gender === 'MALE' ? 'male' : data.gender === 'FEMALE' ? 'female' : undefined;

  return {
    userKey: data.userKey,
    birthday: { year, month, day, gender },
  };
}
