import { callDeepSeek } from './deepseek-client';
import { saveConsultMessage } from './db-consult';

export interface ConsultResult {
  free: string;
  paid: string;
  bullets: string[];
}

function formatBirthday(b: { year: number; month: number; day: number; hour?: number; gender?: 'male' | 'female' }): string {
  const g = b.gender === 'female' ? '여성' : b.gender === 'male' ? '남성' : '미상';
  const h = b.hour !== undefined ? `${b.hour}시생` : '시간 모름';
  return `${b.year}년 ${b.month}월 ${b.day}일생, ${h}, ${g}`;
}

export async function getConsultAnswer(
  question: string,
  birthday?: { year: number; month: number; day: number; hour?: number; gender?: 'male' | 'female' },
): Promise<ConsultResult> {
  const birthStr = birthday ? formatBirthday(birthday) : '정보 없음';

  const prompt = `당신은 사주 운세 상담가입니다. MZ세대 친구에게 말하듯 "팩폭형 공감" 스타일로 상담하세요.

말투 규칙:
- 냉철하게 짚어주되 내 편을 들어주는 느낌
- 한자, 고풍스러운 표현, "귀하" 같은 격식체 절대 금지
- 구체적인 시기(몇 월)를 반드시 포함하세요
- 근거 없는 희망 고문 금지, 안 좋은 것도 솔직하게
- 예: "지금 좀 지치죠? 사실 이 사주는 혼자 다 하려는 경향이 강해요. 3월부턴 그 고집이 추진력으로 바뀔 거예요. 딱 그때까지만 버텨봐요."

사용자 정보
생년월일: ${birthStr}
오늘 날짜: ${new Date().toLocaleDateString('ko-KR')}

사용자 질문: ${question}

반드시 아래 JSON 형식으로만 응답하세요:
{
  "free": "처음 공개 부분 (전체 흐름 + 핵심 해석 일부, 2~3문장으로 핵심만 팩폭)",
  "paid": "심층 분석 (반드시 \\"더 자세히 보면,\\"으로 시작. 구체적 시기와 조언 포함, 4~5단락)",
  "bullets": ["유료 파트 핵심 포인트1", "핵심 포인트2", "핵심 포인트3", "핵심 포인트4"]
}`;

  const text = await callDeepSeek(prompt, 2000, {
    systemMessage: '한국 사주 운세 전문가처럼 MZ세대 친화적으로 해석하세요.',
    temperature: 0.7,
  });
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid AI response');
  const result = JSON.parse(jsonMatch[0]) as ConsultResult;

  // DB 저장 (실패해도 결과는 반환)
  saveConsultMessage(question, result, birthday).catch(console.warn);

  return result;
}
