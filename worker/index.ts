interface Env {
  ANTHROPIC_API_KEY: string;
  CACHE: KVNamespace;
  // mTLS certificate binding for Toss API calls (apps-in-toss)
  TOSS_MTLS: Fetcher;
  // AES-256-GCM decryption key for apps-in-toss login
  TOSS_AES_KEY: string;
  TOSS_AES_AAD: string;
  // Web OAuth credentials (oauth2.cert.toss.im) — separate from apps-in-toss
  TOSS_WEB_CLIENT_ID?: string;
  TOSS_WEB_CLIENT_SECRET?: string;
  TOSS_WEB_AES_KEY?: string;
  TOSS_WEB_AES_AAD?: string;
  // 연결 끊기 콜백 Basic Auth
  UNLINK_CALLBACK_USER?: string;
  UNLINK_CALLBACK_PASS?: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const TOSS_API_BASE = 'https://apps-in-toss-api.toss.im';

// Simple rate limiting: max 30 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (entry.count >= 30) return false;
  entry.count++;
  return true;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function decryptAES256GCM(encryptedBase64: string, aesKeyBase64: string, aad: string): Promise<string> {
  const IV_LENGTH = 12;
  const decoded = base64ToBytes(encryptedBase64);
  const iv = decoded.slice(0, IV_LENGTH);
  const ciphertext = decoded.slice(IV_LENGTH); // includes 16-byte auth tag at end

  const keyBytes = base64ToBytes(aesKeyBase64);
  const key = await crypto.subtle.importKey(
    'raw', keyBytes,
    { name: 'AES-GCM' },
    false,
    ['decrypt'],
  );

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
      additionalData: new TextEncoder().encode(aad),
      tagLength: 128,
    },
    key,
    ciphertext,
  );

  return new TextDecoder().decode(decrypted);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // Rate limit
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!checkRateLimit(ip)) {
      return jsonResponse({ error: 'Rate limit exceeded' }, 429);
    }

    // ── Toss Login ────────────────────────────────────────────────────────────
    if (url.pathname === '/api/toss/login' && request.method === 'POST') {
      return handleTossLogin(request, env);
    }

    // ── Toss 연결 끊기 콜백 ───────────────────────────────────────────────────
    if (url.pathname === '/api/toss/unlink-callback') {
      try {
        const body = await request.json() as { userKey?: string; referrer?: string };
        console.log(`[Toss Unlink] userKey=${body.userKey} referrer=${body.referrer}`);
      } catch { /* 빈 바디 무시 */ }
      return new Response('OK', { status: 200, headers: CORS_HEADERS });
    }

    // ── AI Chat ───────────────────────────────────────────────────────────────
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
    }

    const body = await request.json() as { prompt: string; maxTokens?: number; cacheKey?: string };

    if (body.cacheKey && env.CACHE) {
      const cached = await env.CACHE.get(body.cacheKey);
      if (cached) {
        return jsonResponse({ text: cached });
      }
    }

    if (url.pathname === '/api/chat') {
      return handleChat(body, env);
    }

    if (url.pathname === '/api/chat/stream') {
      return handleChatStream(body, env);
    }

    return new Response('Not found', { status: 404, headers: CORS_HEADERS });
  },
};

// ── Toss OAuth2 login ─────────────────────────────────────────────────────────

async function handleTossLogin(request: Request, env: Env): Promise<Response> {
  const { authorizationCode, referrer } = await request.json() as {
    authorizationCode: string;
    referrer: string;
  };

  if (!authorizationCode || !referrer) {
    return jsonResponse({ error: '필수 파라미터가 누락됐어요.' }, 400);
  }

  // referrer가 URL이면 웹 OAuth 플로우 (oauth2.cert.toss.im)
  const isWebFlow = referrer.startsWith('http');
  if (isWebFlow) {
    return handleWebTossLogin(authorizationCode, referrer, env);
  }

  // apps-in-toss 미니앱 플로우 (mTLS)
  // 1. AccessToken 발급
  const tokenRes = await env.TOSS_MTLS.fetch(
    `${TOSS_API_BASE}/api-partner/v1/apps-in-toss/user/oauth2/generate-token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorizationCode, referrer }),
    },
  );

  const tokenData = await tokenRes.json() as {
    resultType: string;
    success?: { accessToken: string; refreshToken: string };
    error?: { errorCode: string; reason: string };
  };

  if (tokenData.resultType !== 'SUCCESS' || !tokenData.success) {
    return jsonResponse(
      { error: tokenData.error?.reason || '토큰 발급에 실패했어요.' },
      401,
    );
  }

  const { accessToken } = tokenData.success;

  // 2. 사용자 정보 조회
  const meRes = await env.TOSS_MTLS.fetch(
    `${TOSS_API_BASE}/api-partner/v1/apps-in-toss/user/oauth2/login-me`,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    },
  );

  const meData = await meRes.json() as {
    resultType: string;
    success?: {
      userKey: number;
      birthday?: string;
      gender?: string;
      name?: string;
    };
    error?: { errorCode: string; reason: string };
  };

  if (meData.resultType !== 'SUCCESS' || !meData.success) {
    return jsonResponse(
      { error: meData.error?.reason || '사용자 정보 조회에 실패했어요.' },
      401,
    );
  }

  const { userKey, birthday: encBirthday, gender: encGender } = meData.success;

  // 3. AES-256-GCM 복호화
  if (!encBirthday) {
    return jsonResponse({ error: '생년월일 정보가 없어요. 토스 앱에서 동의를 확인해주세요.' }, 422);
  }

  const birthday = await decryptAES256GCM(encBirthday, env.TOSS_AES_KEY, env.TOSS_AES_AAD);
  const gender = encGender
    ? await decryptAES256GCM(encGender, env.TOSS_AES_KEY, env.TOSS_AES_AAD)
    : undefined;

  return jsonResponse({
    userKey: String(userKey),
    birthday,   // yyyyMMdd 형식
    gender,     // MALE | FEMALE | undefined
  });
}

// ── Toss Web OAuth login (oauth2.cert.toss.im) ────────────────────────────────

async function handleWebTossLogin(authorizationCode: string, redirectUri: string, env: Env): Promise<Response> {
  if (!env.TOSS_WEB_CLIENT_ID || !env.TOSS_WEB_CLIENT_SECRET) {
    return jsonResponse({ error: '웹 로그인 설정이 완료되지 않았어요.' }, 503);
  }

  // 1. Authorization code → AccessToken
  const tokenRes = await fetch('https://oauth2.cert.toss.im/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: authorizationCode,
      client_id: env.TOSS_WEB_CLIENT_ID,
      client_secret: env.TOSS_WEB_CLIENT_SECRET,
      redirect_uri: redirectUri,
    }),
  });

  const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
  if (!tokenData.access_token) {
    return jsonResponse({ error: tokenData.error || '토큰 발급에 실패했어요.' }, 401);
  }

  // 2. 사용자 정보 조회
  const meRes = await fetch('https://oauth2.cert.toss.im/oauth2/api/login/user/me/without-di', {
    headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
  });

  const meData = await meRes.json() as {
    resultType?: string;
    success?: { userKey: number; birthday?: string; gender?: string };
    error?: { errorCode: string; reason: string };
  };

  if (meData.resultType !== 'SUCCESS' || !meData.success) {
    return jsonResponse({ error: meData.error?.reason || '사용자 정보 조회에 실패했어요.' }, 401);
  }

  const { userKey, birthday: encBirthday, gender: encGender } = meData.success;

  if (!encBirthday) {
    return jsonResponse({ error: '생년월일 정보가 없어요.' }, 422);
  }

  const aesKey = env.TOSS_WEB_AES_KEY ?? env.TOSS_AES_KEY;
  const aesAad = env.TOSS_WEB_AES_AAD ?? env.TOSS_AES_AAD;
  const birthday = await decryptAES256GCM(encBirthday, aesKey, aesAad);
  const gender = encGender ? await decryptAES256GCM(encGender, aesKey, aesAad) : undefined;

  return jsonResponse({ userKey: String(userKey), birthday, gender });
}

// ── AI Chat handlers ──────────────────────────────────────────────────────────

async function handleChat(
  body: { prompt: string; maxTokens?: number; cacheKey?: string },
  env: Env,
): Promise<Response> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: body.maxTokens || 2048,
      messages: [{ role: 'user', content: body.prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return jsonResponse({ error }, response.status);
  }

  const data = await response.json() as { content: Array<{ text: string }> };
  const text = data.content[0]?.text || '';

  if (body.cacheKey && env.CACHE) {
    await env.CACHE.put(body.cacheKey, text, { expirationTtl: 86400 });
  }

  return jsonResponse({ text });
}

async function handleChatStream(
  body: { prompt: string; maxTokens?: number },
  env: Env,
): Promise<Response> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: body.maxTokens || 2048,
      stream: true,
      messages: [{ role: 'user', content: body.prompt }],
    }),
  });

  if (!response.ok || !response.body) {
    return jsonResponse({ error: 'Stream failed' }, 500);
  }

  return new Response(response.body, {
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
