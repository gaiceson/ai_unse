import { saveFortuneResult } from './db-fortune';

export interface FortuneResult {
  overall: { score: number; message: string };
  love: { score: number; message: string };
  money: { score: number; message: string };
  health: { score: number; message: string };
  luck: { score: number; message: string };
  detail: string;
  timing?: string;
  luckyItem: string;
  luckyColor: string;
  luckyNumber: number;
  advice: string;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateDetail(
  year: number, month: number, day: number,
  overall: number, love: number, money: number, health: number, luck: number,
  rand: () => number,
): string {
  const best = love >= money && love >= health && love >= luck ? '연애'
    : money >= health && money >= luck ? '재물'
    : health >= luck ? '건강' : '행운';
  const worst = love <= money && love <= health && love <= luck ? '연애'
    : money <= health && money <= luck ? '재물'
    : health <= luck ? '건강' : '행운';

  const timeSlots = [
    '오전엔 머리가 잘 안 돌아가는 날이에요. 중요한 판단은 오후로 미루세요.',
    '아침부터 뭔가 잘 풀리는 흐름이에요. 이 기세 그냥 흘려보내기 아깝죠?',
    '점심 전후로 에너지가 갑자기 올라오는 타이밍이에요. 그때 치고 나가세요.',
    '오늘은 저녁이 진짜예요. 낮엔 좀 허탈해도 저녁에 반전이 와요.',
    '오전에 할 일 다 끝내두면 오후가 훨씬 편해지는 날이에요.',
    '밤에 좋은 생각이 많이 나는 날이에요. 자기 전에 메모해두세요.',
  ];

  const connections = [
    '오늘 먼저 연락 온 사람, 그냥 지나치지 마세요. 뭔가 이유가 있어요.',
    '혼자 끙끙 앓지 말고 한 명한테만 털어놔도 훨씬 가벼워질 거예요.',
    '오늘은 내가 먼저 손 내밀면 생각보다 잘 받아줘요. 어색해도 해보세요.',
    '새로 만나는 사람이 있다면 그냥 넘기지 마세요. 꽤 괜찮은 인연일 수 있어요.',
    '오래된 친구한테 연락이 오면 꼭 받으세요. 좋은 얘기 들을 수 있어요.',
    '오늘은 팀플보다 혼자가 더 잘 되는 날이에요. 같이하면 오히려 삐걱거려요.',
  ];

  const ages = [
    `${year}년생, 오늘 유독 예민하게 느껴진다면 사주 기운 때문이에요. 탓하세요.`,
    `${month}월생 특유의 감 좋은 날이에요. 오늘은 직감 믿어도 돼요.`,
    `${day}일생은 오늘 평소보다 주목받을 가능성이 높아요. 표정 관리하세요.`,
    `${year}년생, 요즘 좀 지치죠? 오늘은 그냥 나를 위한 하루로 써도 괜찮아요.`,
    `${month}월에 태어난 사람, 오늘따라 아이디어가 샘솟는 이유 있어요. 적어두세요.`,
    `${day}일생은 오늘 결정한 것들이 꽤 오래 가는 날이에요. 신중하게 고르세요.`,
  ];

  const overallFlow = overall >= 80
    ? '오늘 솔직히 좀 잘 풀리는 날이에요. 이런 날 많지 않으니까 잘 써먹어요.'
    : overall >= 65
    ? '엄청 좋지도 나쁘지도 않은 딱 평타 치는 날이에요. 무리하지 않으면 돼요.'
    : '오늘은 좀 조심스러운 날이에요. 큰 결정이나 새 시작은 내일로 미루는 게 나아요.';

  const bestWorst = best === worst
    ? '오늘은 운이 한쪽으로 몰리지 않고 고르게 퍼져 있어요. 균형 잡힌 하루예요.'
    : `${best}운이 오늘 제일 살아있어요. 반대로 ${worst} 쪽은 오늘 좀 조심하는 게 좋아요.`;

  const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

  return `${overallFlow} ${bestWorst} ${pick(ages)} ${pick(timeSlots)} ${pick(connections)}`;
}

function generateFortune(year: number, month: number, day: number): FortuneResult {
  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();
  const seed = year * 10000 + month * 100 + day + todayYear * 1000 + todayMonth * 32 + todayDay;
  const rand = seededRandom(seed);
  const score = (min: number, max: number) => Math.round(min + rand() * (max - min));

  const overallScore = score(55, 95);
  const loveScore = score(40, 98);
  const moneyScore = score(45, 95);
  const healthScore = score(50, 95);
  const luckScore = score(35, 99);

  const loveMessages = [
    '솔직히 지금 좀 기다리는 감정 있죠? 오늘 그 사람한테서 연락 올 수 있어요.',
    '연애운보단 내 감정 정리가 먼저인 날이에요. 억지로 뭔가 하지 않아도 돼요.',
    '하고 싶은 말 있으면 오늘 하세요. 타이밍이 꽤 좋아요.',
    '연인이랑 사소한 거로 티격태격할 수 있어요. 이기려 하지 말고 그냥 웃고 넘기세요.',
    '혼자인 게 외롭게 느껴지는 날이에요. 근데 이 감정 오래 안 가요. 괜찮아요.',
    '옛 인연 생각날 수 있는데, 연락하기 전에 왜 헤어졌는지 먼저 떠올려 보세요.',
    '상대방이 표현을 안 한다고 관심 없는 게 아니에요. 오늘은 믿어줘도 괜찮아요.',
    '고백하기 좋은 날인데, 완벽한 타이밍 기다리다가 또 넘어가는 거 아니죠?',
    '질투심이 올라오는 날이에요. 솔직하게 말하면 오히려 더 가까워질 수 있어요.',
    '오늘 우연히 만나는 사람, 그냥 지나치지 마세요. 꽤 괜찮을 수 있어요.',
    '연인한테 작은 것 하나라도 챙겨주면 오늘 효과가 두 배예요.',
    '오늘은 연애보다 나 자신한테 잘해주는 게 더 중요한 날이에요.',
  ];
  const moneyMessages = [
    '예상 못 한 곳에서 돈이 들어올 수 있어요. 기대는 하되 너무 믿진 마세요.',
    '투자 욕구가 올라오는 날인데, 오늘만큼은 한 번 더 생각하고 누르세요.',
    '돈 흐름이 나쁘진 않아요. 근데 지금 쓸 필요 없는 걸 쓰려고 하진 않죠?',
    '영수증 한 번 보세요. 어디서 새는지 알면 의외로 꽤 아낄 수 있어요.',
    '부업이나 사이드 수입 쪽에 좋은 신호가 보여요. 눈여겨볼 때예요.',
    '오늘 큰 결제는 내일로 미루세요. 자고 일어나면 생각이 달라질 수 있어요.',
    '돈 관련 약속이나 계약은 오늘 꼼꼼히 다시 확인하세요. 실수하기 쉬운 날이에요.',
    '기다리던 입금이나 정산이 오늘 들어올 수 있어요. 확인해보세요.',
    '지금 카트에 담아둔 거 정말 필요한 거 맞아요? 한 번만 더 생각해보세요.',
    '재테크 공부 시작하기 딱 좋은 날이에요. 유튜브 하나만 봐도 돼요.',
    '친구한테 돈 빌려주거나 같이 투자하는 건 오늘 특히 조심하세요.',
    '지금 아끼는 게 답답해 보여도, 3개월 뒤에 감사하게 될 거예요.',
  ];
  const healthMessages = [
    '수면 부족이 쌓여 있는 날이에요. 오늘은 진짜로 일찍 자야 해요.',
    '오늘 10분만 걸어도 머리가 훨씬 맑아져요. 진짜예요.',
    '물 마지막으로 마신 게 언제예요? 지금 바로 한 잔 드세요.',
    '몸이 뭉쳐 있는 거 느껴지죠? 1분 스트레칭만 해도 달라요.',
    '자극적인 거 당기는 날인데 오늘은 위가 좀 예민해요. 슬쩍 참아보세요.',
    '눈 피로가 극에 달하는 날이에요. 20분마다 10초라도 눈 감아주세요.',
    '아침에 몸 조금 움직여두면 오늘 하루 컨디션이 진짜 달라요.',
    '머리가 복잡한 날이에요. 심호흡 세 번만 해도 생각보다 정리돼요.',
    '허리 요즘 괜찮아요? 앉은 자세 한번 체크하세요. 슬금슬금 나빠지고 있어요.',
    '오늘 과일 하나만 챙겨 먹어도 몸이 고마워해요.',
    '무리한 운동보다 가볍게 몸 푸는 게 오늘 더 맞아요.',
    '따뜻한 음료 한 잔이 지금 이 순간 생각보다 많이 도움 돼요.',
  ];
  const luckMessages = [
    '오늘 행운은 내가 먼저 움직일 때 따라와요. 기다리면 그냥 지나가요.',
    '새로운 거 시도하기 좋은 날이에요. 작은 거라도 하나 도전해봐요.',
    '별 기대 없이 나선 자리에서 좋은 일 생기는 날이에요.',
    '좋은 소식이 오늘 중에 하나 올 수 있어요. 핸드폰 확인해보세요.',
    '길 걷다 뭔가 눈에 띄면 그냥 지나치지 마세요. 오늘의 시그널일 수 있어요.',
    '오래된 물건 하나 정리해보세요. 예상치 못한 걸 발견할 수 있어요.',
    '오늘 처음 보는 사람, 은근히 중요한 인연일 수 있어요.',
    '이벤트나 추첨 뭔가 참여할 게 있으면 오늘 해보세요. 나쁘지 않아요.',
    '포기하려던 거 있으면 오늘 하루만 더 버텨보세요. 반전이 있을 수 있어요.',
    '오늘 행운은 아침보다 저녁 쪽에 몰려있어요. 저녁 약속 있으면 기대해도 돼요.',
    '무겁게 생각하지 말고 그냥 웃으면서 하루 보내세요. 오늘은 그게 답이에요.',
    '별거 아닌 것 같은 선택이 오늘은 꽤 좋은 결과로 이어질 수 있어요.',
  ];
  const overallMessages = [
    '오늘 운 꽤 좋은 편이에요. 이런 날 그냥 흘려보내기 아깝죠?',
    '평타 치는 날이에요. 특별히 잘 되는 것도 없지만 크게 꼬이는 것도 없어요.',
    '뭔가 새로운 기회가 슬쩍 들어오는 날이에요. 눈 크게 뜨고 있어요.',
    '집중력이 좋은 날이에요. 미뤄뒀던 거 오늘 처리하면 생각보다 빨리 끝나요.',
    '에너지 넘치는 날이에요. 지금 하고 싶은 거 있으면 지금 하세요.',
    '오전엔 좀 지지부진하다가 오후부터 갑자기 잘 풀리기 시작하는 날이에요.',
    '사람 만나면 좋은 일 생기는 날이에요. 방에만 있으면 손해예요.',
    '직감이 오늘 특히 잘 맞아요. 논리보다 느낌을 더 믿어봐도 되는 날이에요.',
    '일상에 작은 변화 하나만 줘도 운이 따라 올라오는 날이에요.',
    '오늘은 쉬어가는 날이에요. 쉬는 것도 전략이고 용기예요.',
    '좀 버거운 날이지만 이 과정이 나중에 성장으로 돌아와요. 지금은 그냥 버텨요.',
    '혼자 해결하려 하지 말고 주변에 도움 요청해보세요. 오늘은 그게 더 빨라요.',
  ];

  const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

  const items = ['우산', '볼펜', '책', '열쇠고리', '손수건', '사탕', '동전', '귤', '장미', '머그컵'];
  const colors = ['파란색', '보라색', '초록색', '노란색', '분홍색', '하얀색', '빨간색', '금색'];

  return {
    overall: { score: overallScore, message: pick(overallMessages) },
    love: { score: loveScore, message: pick(loveMessages) },
    money: { score: moneyScore, message: pick(moneyMessages) },
    health: { score: healthScore, message: pick(healthMessages) },
    luck: { score: luckScore, message: pick(luckMessages) },
    detail: generateDetail(year, month, day, overallScore, loveScore, moneyScore, healthScore, luckScore, rand),
    luckyItem: pick(items),
    luckyColor: pick(colors),
    luckyNumber: Math.floor(rand() * 45) + 1,
    advice: overallScore >= 80
      ? '오늘 운 좋은 날이에요. 이럴 때 아끼지 말고 하고 싶은 거 하세요.'
      : '오늘은 무리하지 않는 게 정답이에요. 그냥 흘러가게 두세요.',
  };
}

export async function getFortune(year: number, month: number, day: number): Promise<FortuneResult> {
  // 생년월일 + 오늘 날짜 시드 기반 결정적 랜덤 생성 (AI 불필요)
  // generateFortune은 동일 입력에 항상 동일 결과 → DB 캐시 조회 불필요
  const result = generateFortune(year, month, day);

  // DB 저장 (백그라운드, 실패해도 무관)
  saveFortuneResult(year, month, day, result).catch(console.warn);

  return result;
}
