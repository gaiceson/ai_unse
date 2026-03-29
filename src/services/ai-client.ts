const API_URL = import.meta.env.VITE_AI_PROXY_URL || '';

interface AiRequest {
  prompt: string;
  maxTokens?: number;
}

interface AiResponse {
  text: string;
}

export async function callAI({ prompt, maxTokens = 2048 }: AiRequest): Promise<AiResponse> {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, maxTokens }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  return { text: data.text };
}

export async function callAIStream(
  { prompt, maxTokens = 2048 }: AiRequest,
  onChunk: (text: string) => void,
): Promise<void> {
  const response = await fetch(`${API_URL}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, maxTokens }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    onChunk(chunk);
  }
}
