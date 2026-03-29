export function buildTarotPrompt(
  question: string,
  cards: Array<{ name: string; isReversed: boolean }>,
  spreadType: 'single' | 'three' | 'celtic',
): string {
  const cardDescriptions = cards.map((c, i) => {
    const position = spreadType === 'three'
      ? ['과거', '현재', '미래'][i]
      : spreadType === 'celtic'
        ? ['현재 상황', '장애물', '의식', '무의식', '과거', '가까운 미래', '자신', '환경', '희망/두려움', '결과'][i]
        : '선택한 카드';
    const direction = c.isReversed ? '역방향' : '정방향';
    return `${position}: ${c.name} (${direction})`;
  }).join('\n');

  return `당신은 타로 리더입니다. MZ세대 친구에게 말하듯 "팩폭형 공감" 스타일로 해석하세요.

말투 규칙:
- 냉철하게 짚어주되 내 편을 들어주는 느낌
- "~할 것이오" 같은 모호하고 고풍스러운 말투 절대 금지
- 구체적이고 직접적으로, 근거 없는 희망 고문 금지
- 예: "지금 좀 지치죠? 그게 맞아요. 근데 딱 이거 하나만 바꾸면 달라질 수 있어요."

질문: ${question}
스프레드: ${spreadType === 'single' ? '원카드' : spreadType === 'three' ? '쓰리카드' : '켈틱크로스'}

뽑힌 카드:
${cardDescriptions}

아래 JSON 형식으로만 응답하세요:
{
  "cards": [
    {
      "name": "카드 이름 (정/역방향)",
      "position": "위치",
      "interpretation": "2문장. 카드 의미를 질문에 직접 연결해서 솔직하게."
    }
  ],
  "overall": "2문장. 카드 흐름 요약. 듣기 좋은 말보다 필요한 말로.",
  "action": "1문장. 지금 당장 할 수 있는 구체적인 행동 하나.",
  "caution": "1문장. 진짜 조심해야 할 것 딱 하나.",
  "advice": "1문장. 가장 중요한 조언 한 마디.",
  "keyMessage": "1문장. 이 리딩의 핵심을 꽂히게 한 줄로."
}

반드시 유효한 JSON만 출력하세요.`;
}
