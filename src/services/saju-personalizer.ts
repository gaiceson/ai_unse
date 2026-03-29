export interface PersonalizedInsight {
  icon: string;
  label: string;
  message: string;
}

// ── 나이 기반 (만 나이 기준) ─────────────────────────────────
function getAge(birthYear: number): number {
  const today = new Date();
  return today.getFullYear() - birthYear;
}

function getAgeMessage(age: number): { icon: string; label: string; message: string } {
  if (age < 20) return {
    icon: '🌱',
    label: '10대',
    message: '사주 기운이 자리잡는 시기예요. 지금 뭘 좋아하는지 찾는 게 맞는 방향이에요.',
  };
  if (age < 25) return {
    icon: '🔍',
    label: '20대 초반',
    message: '뭘 해야 할지 아직 모른다면 정상이에요. 이 시기에 다 알면 오히려 이상한 거예요.',
  };
  if (age < 30) return {
    icon: '🚀',
    label: '20대 후반',
    message: '내가 뭘 잘하는지 슬슬 보이기 시작할 나이예요. 그 느낌 믿어도 돼요.',
  };
  if (age < 35) return {
    icon: '🏗️',
    label: '30대 초반',
    message: '30대 초는 기반을 만드는 시기예요. 지금 좀 버겁다고 잘못된 게 아니에요.',
  };
  if (age < 40) return {
    icon: '⚡',
    label: '30대 후반',
    message: '지금 선택 하나가 향후 몇 년 흐름을 바꿀 수 있어요. 신중하되 너무 오래 고민하지 마세요.',
  };
  if (age < 45) return {
    icon: '⚖️',
    label: '40대 초반',
    message: '안정이냐 변화냐 고민되죠? 이 나이에 그 고민 느끼는 건 지극히 정상이에요.',
  };
  if (age < 50) return {
    icon: '🌾',
    label: '40대 후반',
    message: '지금까지 쌓아온 게 슬슬 결실로 돌아올 시기가 가까워지고 있어요.',
  };
  if (age < 55) return {
    icon: '🧭',
    label: '50대 초반',
    message: '이제부턴 내가 원하는 방향으로 살아도 될 시기예요. 남 눈치 그만 봐도 돼요.',
  };
  if (age < 60) return {
    icon: '🌅',
    label: '50대 후반',
    message: '지금까지 버텨온 것 자체가 대단한 거예요. 앞으로는 조금 더 편해져도 돼요.',
  };
  return {
    icon: '✨',
    label: '60대 이상',
    message: '사주대로 살아왔다는 게 이제 보이죠? 남은 시간은 하고 싶은 것 하세요.',
  };
}

// ── 계절 기반 (태어난 월) ────────────────────────────────────
function getSeasonMessage(month: number): { icon: string; label: string; message: string } {
  if (month >= 3 && month <= 5) return {
    icon: '🌸',
    label: '봄생 (3~5월)',
    message: '봄에 태어난 사람은 시작의 기운이 강해요. 새로운 도전에 강하지만 마무리를 의식적으로 챙겨야 해요.',
  };
  if (month >= 6 && month <= 8) return {
    icon: '☀️',
    label: '여름생 (6~8월)',
    message: '여름에 태어난 사람은 열정과 추진력이 강해요. 에너지가 넘치지만 소진도 빠른 편이라 쉬는 것도 전략이에요.',
  };
  if (month >= 9 && month <= 11) return {
    icon: '🍂',
    label: '가을생 (9~11월)',
    message: '가을에 태어난 사람은 결실의 기운이 강해요. 실속 챙기는 능력이 남들보다 뛰어난 편이에요.',
  };
  return {
    icon: '❄️',
    label: '겨울생 (12~2월)',
    message: '겨울에 태어난 사람은 내면이 깊고 저력이 강해요. 느리게 시작해도 결국 이루는 타입이에요.',
  };
}

// ── 시간 기반 (태어난 시) ────────────────────────────────────
function getHourMessage(hour: number): { icon: string; label: string; message: string } {
  if (hour >= 0 && hour < 5) return {
    icon: '🌙',
    label: '새벽생 (0~4시)',
    message: '새벽에 태어난 사람은 조용하고 깊은 내면의 힘이 있어요. 혼자 있을 때 더 강해지는 타입이에요.',
  };
  if (hour >= 5 && hour < 12) return {
    icon: '🌤️',
    label: '아침생 (5~11시)',
    message: '아침에 태어난 사람은 활동력과 시작의 기운이 강해요. 일찍 움직일수록 운이 따라오는 타입이에요.',
  };
  if (hour >= 12 && hour < 18) return {
    icon: '☀️',
    label: '낮생 (12~17시)',
    message: '낮에 태어난 사람은 사교성과 표현력이 좋아요. 사람들 사이에 있을 때 가장 빛나는 타입이에요.',
  };
  return {
    icon: '🌆',
    label: '저녁생 (18~23시)',
    message: '저녁에 태어난 사람은 감수성이 풍부하고 직관이 날카로워요. 밤에 아이디어가 잘 떠오르는 타입이에요.',
  };
}

// ── 메인 함수 ────────────────────────────────────────────────
export function getPersonalizedInsights(
  birthYear: number,
  birthMonth: number,
  birthHour?: number,
): PersonalizedInsight[] {
  const age = getAge(birthYear);
  const insights: PersonalizedInsight[] = [
    getAgeMessage(age),
    getSeasonMessage(birthMonth),
  ];
  if (birthHour !== undefined) {
    insights.push(getHourMessage(birthHour));
  }
  return insights;
}
