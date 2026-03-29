const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY as string;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

interface CallOptions {
  maxTokens?: number;
  temperature?: number;
  systemMessage?: string;
}

export async function callDeepSeek(prompt: string, maxTokens = 1500, options: CallOptions = {}): Promise<string> {
  if (!DEEPSEEK_API_KEY) throw new Error('VITE_DEEPSEEK_API_KEY 환경변수가 설정되지 않았습니다.');

  const { temperature = 1.0, systemMessage } = options;
  const messages = [
    ...(systemMessage ? [{ role: 'system', content: systemMessage }] : []),
    { role: 'user', content: prompt },
  ];

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      max_tokens: maxTokens,
      temperature,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content as string;
}

// 스트리밍 버전 — 청크마다 onChunk 콜백 호출, 완성된 전체 텍스트 반환
export async function callDeepSeekStream(
  prompt: string,
  onChunk: (partial: string) => void,
  maxTokens = 1500,
): Promise<string> {
  if (!DEEPSEEK_API_KEY) throw new Error('VITE_DEEPSEEK_API_KEY 환경변수가 설정되지 않았습니다.');

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${err}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder.decode(value, { stream: true }).split('\n');
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') break;
      try {
        const delta = JSON.parse(data).choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          onChunk(full);
        }
      } catch { /* 불완전한 청크 무시 */ }
    }
  }

  return full;
}
