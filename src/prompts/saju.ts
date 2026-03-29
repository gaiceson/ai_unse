import type { SajuPillars } from '../services/saju-calculator';

function pillarsToStr(p: SajuPillars['fourPillars']): string {
  return `년주: ${p.year.heavenly}${p.year.earthly} / 월주: ${p.month.heavenly}${p.month.earthly} / 일주: ${p.day.heavenly}${p.day.earthly} / 시주: ${p.hour.heavenly}${p.hour.earthly}`;
}

function elementsToStr(e: SajuPillars['fiveElements']): string {
  return `목(木)${e.wood} 화(火)${e.fire} 토(土)${e.earth} 금(金)${e.metal} 수(水)${e.water}`;
}

/** 무료 분석: 사주 구조 전달 → 키워드·티저·재물 미리보기 해석 */
export function buildSajuFreePrompt(
  pillars: SajuPillars,
  gender: 'male' | 'female',
): string {
  const genderStr = gender === 'male' ? '남성' : '여성';
  return `당신은 사주팔자 해석 전문가입니다. 아래 계산된 사주 구조를 바탕으로 해석해주세요.

사주팔자: ${pillarsToStr(pillars.fourPillars)}
오행 분포: ${elementsToStr(pillars.fiveElements)}
주 오행: ${pillars.mainElement}
성별: ${genderStr}

다음 JSON 형식으로 응답해주세요:
{
  "keywords": ["누구나 바로 이해할 수 있는 짧은 특징 (예: 독립적인 성향, 재물운 상승형, 감수성이 풍부함)", "특징 2", "특징 3"],
  "lifeKeywords": ["인생 키워드 1 (5자 이내, 예: 도전과 성장)", "키워드 2", "키워드 3"],
  "teaser": "이 사주에서 발견한 가장 주목할 특징 2문장. 구체적이고 더 알고 싶게 만드는 내용.",
  "wealthPreview": "재물운 핵심 2문장 미리보기. 언제부터 재물이 모이는지, 어떤 방식으로 부를 쌓는지."
}

반드시 유효한 JSON만 출력하세요.`;
}

/** 유료 상세 분석: 사주 구조 전달 → 전체 해석 생성 */
export function buildSajuDetailedPrompt(
  pillars: SajuPillars,
  gender: 'male' | 'female',
): string {
  const genderStr = gender === 'male' ? '남성' : '여성';
  return `당신은 사주 해석가입니다. MZ세대 친구에게 말하듯 "팩폭형 공감" 스타일로 해석하세요.

말투 규칙:
- 냉철하게 짚어주되 내 편을 들어주는 느낌
- 모호한 표현, 한자, 고풍스러운 말투 절대 금지
- 구체적이고 직접적으로, 각 항목 지정된 문장 수 엄수 (lifeFlow는 7문장)
- 예: "지금 좀 지치죠? 사실 이 사주는 혼자 다 하려는 경향이 강해요. 3월부터 흐름이 바뀌니까 딱 그때까지만 버텨봐요."

사주팔자: ${pillarsToStr(pillars.fourPillars)}
오행 분포: ${elementsToStr(pillars.fiveElements)}
주 오행: ${pillars.mainElement}
성별: ${genderStr}

다음 JSON 형식으로 응답해주세요:
{
  "wealth": "재물운 3문장 (돈 버는 방식, 재물 모이는 시기, 조심할 소비 패턴 솔직하게)",
  "marriage": "연애/결혼운 3문장 (어떤 사람에게 끌리는지, 연애 스타일의 장단점, 주의할 점)",
  "yearlyFortune": "올해 운세 3문장 (상반기 현실적 흐름, 하반기 변화 포인트, 올해 집중할 것)",
  "career": "직업운 3문장 (잘 맞는 일과 이유, 커리어에서 조심할 것, 언제 터닝포인트 오는지)",
  "relationship": "인간관계 3문장 (관계 패턴의 강점과 약점, 좋은 인연 만나는 방법, 조심할 인연)",
  "health": "건강운 3문장 (약한 부분 솔직하게, 지금 당장 할 수 있는 관리법, 조심할 시기)",
  "luckyInfo": "행운 정보 3문장 (행운의 색·숫자·방향을 친근하게. 예: 행운 색은 파란색이에요. 지갑이나 소품에 활용해보세요.)",
  "lifeFlow": "인생 전체 흐름을 친한 친구가 들려주듯 자연스럽게 7문장으로. 유년기→10대→20대→30대→40대→50대→노년 순서로, 각 시기의 핵심 에너지와 감정을 구체적으로. 숫자 번호 없이 이어지는 이야기처럼 써주세요."
}

반드시 유효한 JSON만 출력하세요.`;
}
