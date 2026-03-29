export function buildFortunePrompt(year: number, month: number, day: number): string {
  const today = new Date();
  const todayStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  return `당신은 동양 철학과 점성술에 정통한 운세 전문가입니다.
아래 사용자의 생년월일을 기반으로 오늘(${todayStr})의 운세를 깊이 있게 분석해주세요.

생년월일: ${year}년 ${month}월 ${day}일

다음 JSON 형식으로 정확히 응답해주세요:
{
  "overall": { "score": 85, "message": "종합 운세 요약 (2-3문장, 오늘의 전반적인 기운과 흐름 설명)" },
  "love": { "score": 75, "message": "연애운 설명 (2-3문장, 현재 관계나 만남의 기운, 구체적인 상황 묘사)" },
  "money": { "score": 90, "message": "재물운 설명 (2-3문장, 금전 흐름, 투자·지출 관련 조언 포함)" },
  "health": { "score": 80, "message": "건강운 설명 (2-3문장, 주의할 신체 부위나 컨디션 관리 방법)" },
  "luck": { "score": 70, "message": "행운 설명 (2-3문장, 오늘 행운이 찾아오는 시간대나 상황)" },
  "detail": "오늘의 상세 운세 (6-8문장, 오늘 하루의 전체적인 흐름, 오전/오후 에너지 변화, 대인관계에서 주의할 점, 기회를 잡는 방법 등을 구체적으로 서술)",
  "timing": "오늘 가장 좋은 시간대와 피해야 할 시간대 (2문장)",
  "luckyItem": "행운의 아이템 (구체적인 물건과 이유)",
  "luckyColor": "행운의 색상 (이유 포함)",
  "luckyNumber": 7,
  "advice": "오늘의 핵심 조언 (2-3문장, 실천 가능한 구체적인 행동 지침)"
}

점수는 0~100 사이 정수로, 오늘 날짜와 생년월일의 기운을 고려하여 현실적으로 배정하세요.
각 항목의 설명은 추상적이지 않고 구체적이며 실용적으로 작성하세요.
반드시 유효한 JSON만 출력하세요.`;
}
