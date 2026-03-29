import type { SajuPillars } from '../services/saju-calculator';

// AI에게는 내부 사주 구조만 전달, 출력은 한자 없이 쉬운 말로
function toAiInput(p: SajuPillars): string {
  const fp = p.fourPillars;
  const fe = p.fiveElements;
  return `사주: ${fp.year.heavenly}${fp.year.earthly}-${fp.month.heavenly}${fp.month.earthly}-${fp.day.heavenly}${fp.day.earthly} / 기운: 목${fe.wood} 화${fe.fire} 토${fe.earth} 금${fe.metal} 수${fe.water}`;
}

export function buildCompatibilityPrompt(
  person1: { year: number; month: number; day: number; name?: string },
  person2: { year: number; month: number; day: number; name?: string },
  p1Pillars: SajuPillars,
  p2Pillars: SajuPillars,
): string {
  const name1 = person1.name || '나';
  const name2 = person2.name || '상대';

  return `당신은 궁합 분석가입니다. MZ세대 친구에게 말하듯 "팩폭형 공감" 스타일로 분석하세요.

말투 규칙:
- 냉철하게 짚어주되 두 사람 편을 들어주는 느낌
- 근거 없는 희망 고문 금지, 모호한 표현 금지
- 구체적이고 직접적으로. 예: "이 둘, 처음엔 잘 맞는 것 같아도 결정적인 순간에 갈등이 나와요. 근데 그 갈등 넘기면 오히려 더 단단해지는 타입이에요."

${name1}: ${toAiInput(p1Pillars)}
${name2}: ${toAiInput(p2Pillars)}

다음 JSON 형식으로 응답해주세요:
{
  "overallScore": 76,
  "chemistryType": "두 사람의 케미 유형 (예: 불꽃 케미, 안정 케미, 티격태격 케미)",
  "relationshipType": "관계 발전 방향 (예: 친구에서 연인으로, 첫눈에 반하는 타입)",
  "keywords": ["직관적인 키워드1", "키워드2", "키워드3"],
  "loveChance": 72,
  "loveChancePreview": "연애 가능성 솔직하게 1문장",
  "strengthsPreview": "두 사람의 가장 큰 강점 1문장"
}

반드시 유효한 JSON만 출력하세요.`;
}

export function buildCompatibilityDetailPrompt(
  person1: { year: number; month: number; day: number; name?: string },
  person2: { year: number; month: number; day: number; name?: string },
  p1Pillars: SajuPillars,
  p2Pillars: SajuPillars,
): string {
  const name1 = person1.name || '나';
  const name2 = person2.name || '상대';

  return `당신은 궁합 분석가입니다. MZ세대 친구에게 말하듯 "팩폭형 공감" 스타일로 분석하세요.

말투 규칙:
- 냉철하게 짚어주되 두 사람 편을 들어주는 느낌
- 근거 없는 희망 고문 금지, 모호한 표현 금지
- 각 항목은 정확히 2문장, 구체적이고 직접적으로
- 예: "이 둘은 싸울 때 서로 말을 끊는 패턴이 있어요. 누가 먼저 입 다물고 나중에 얘기하자고 하면 그 사람이 이기는 거예요."

${name1}: ${toAiInput(p1Pillars)}
${name2}: ${toAiInput(p2Pillars)}

다음 JSON 형식으로 응답해주세요:
{
  "categories": {
    "love": { "score": 90, "message": "연애 궁합 2문장" },
    "communication": { "score": 80, "message": "소통 궁합 2문장" },
    "values": { "score": 75, "message": "가치관 궁합 2문장" },
    "lifestyle": { "score": 88, "message": "생활 궁합 2문장" }
  },
  "loveChanceDetail": "연애 가능성 솔직하게 2문장",
  "strengths": "이 관계의 진짜 강점 2문장",
  "cautions": "조심 안 하면 진짜 문제 되는 것 2문장",
  "fightPattern": "싸울 때 어떻게 싸우는지 + 해결법 2문장",
  "marriageCompat": "결혼하면 어떨지 현실적으로 2문장",
  "moneyCompat": "돈 문제에서 충돌 포인트와 해결법 2문장",
  "longevity": "오래 갈 수 있는지 솔직하게 2문장",
  "breakupRisk": "이 관계를 망치는 가장 큰 요인 2문장",
  "futureOutlook": "앞으로 이 관계가 어떻게 될지 2문장",
  "advice": "이 둘에게 가장 필요한 조언 2문장"
}

반드시 유효한 JSON만 출력하세요.`;
}
