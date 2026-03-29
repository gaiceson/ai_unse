export interface TarotCardData {
  id: number;
  name: string;
  nameKo: string;
  arcana: 'major' | 'minor';
  suit?: 'wands' | 'cups' | 'swords' | 'pentacles';
  emoji: string;
}

export const MAJOR_ARCANA: TarotCardData[] = [
  { id: 0, name: 'The Fool', nameKo: '바보', arcana: 'major', emoji: '🃏' },
  { id: 1, name: 'The Magician', nameKo: '마법사', arcana: 'major', emoji: '🎩' },
  { id: 2, name: 'The High Priestess', nameKo: '여사제', arcana: 'major', emoji: '🌙' },
  { id: 3, name: 'The Empress', nameKo: '여황제', arcana: 'major', emoji: '👑' },
  { id: 4, name: 'The Emperor', nameKo: '황제', arcana: 'major', emoji: '🏛️' },
  { id: 5, name: 'The Hierophant', nameKo: '교황', arcana: 'major', emoji: '⛪' },
  { id: 6, name: 'The Lovers', nameKo: '연인', arcana: 'major', emoji: '💕' },
  { id: 7, name: 'The Chariot', nameKo: '전차', arcana: 'major', emoji: '🏇' },
  { id: 8, name: 'Strength', nameKo: '힘', arcana: 'major', emoji: '🦁' },
  { id: 9, name: 'The Hermit', nameKo: '은둔자', arcana: 'major', emoji: '🏔️' },
  { id: 10, name: 'Wheel of Fortune', nameKo: '운명의 수레바퀴', arcana: 'major', emoji: '🎡' },
  { id: 11, name: 'Justice', nameKo: '정의', arcana: 'major', emoji: '⚖️' },
  { id: 12, name: 'The Hanged Man', nameKo: '매달린 사람', arcana: 'major', emoji: '🙃' },
  { id: 13, name: 'Death', nameKo: '죽음', arcana: 'major', emoji: '💀' },
  { id: 14, name: 'Temperance', nameKo: '절제', arcana: 'major', emoji: '⚗️' },
  { id: 15, name: 'The Devil', nameKo: '악마', arcana: 'major', emoji: '😈' },
  { id: 16, name: 'The Tower', nameKo: '탑', arcana: 'major', emoji: '🗼' },
  { id: 17, name: 'The Star', nameKo: '별', arcana: 'major', emoji: '⭐' },
  { id: 18, name: 'The Moon', nameKo: '달', arcana: 'major', emoji: '🌕' },
  { id: 19, name: 'The Sun', nameKo: '태양', arcana: 'major', emoji: '☀️' },
  { id: 20, name: 'Judgement', nameKo: '심판', arcana: 'major', emoji: '📯' },
  { id: 21, name: 'The World', nameKo: '세계', arcana: 'major', emoji: '🌍' },
];

const SUITS: Array<{ suit: TarotCardData['suit']; nameKo: string; emoji: string }> = [
  { suit: 'wands', nameKo: '완드', emoji: '🪄' },
  { suit: 'cups', nameKo: '컵', emoji: '🏆' },
  { suit: 'swords', nameKo: '소드', emoji: '⚔️' },
  { suit: 'pentacles', nameKo: '펜타클', emoji: '🪙' },
];

const RANKS = ['에이스', '2', '3', '4', '5', '6', '7', '8', '9', '10', '페이지', '나이트', '퀸', '킹'];

export const MINOR_ARCANA: TarotCardData[] = SUITS.flatMap((s, si) =>
  RANKS.map((rank, ri) => ({
    id: 22 + si * 14 + ri,
    name: `${rank === '에이스' ? 'Ace' : rank} of ${s.suit!.charAt(0).toUpperCase() + s.suit!.slice(1)}`,
    nameKo: `${s.nameKo}의 ${rank}`,
    arcana: 'minor' as const,
    suit: s.suit,
    emoji: s.emoji,
  })),
);

export const FULL_DECK: TarotCardData[] = [...MAJOR_ARCANA, ...MINOR_ARCANA];

// ── 로컬 셔플 (fallback용) ────────────────────────────────────
export function drawCards(count: number, majorOnly = false): Array<TarotCardData & { isReversed: boolean }> {
  const deck = majorOnly ? [...MAJOR_ARCANA] : [...FULL_DECK];
  const drawn: Array<TarotCardData & { isReversed: boolean }> = [];

  for (let i = 0; i < count && deck.length > 0; i++) {
    const idx = Math.floor(Math.random() * deck.length);
    const card = deck.splice(idx, 1)[0];
    drawn.push({ ...card, isReversed: Math.random() > 0.5 });
  }

  return drawn;
}

// ── DB에서 카드 덱 가져오기 (세션 내 캐시) ────────────────────
let deckCache: TarotCardData[] | null = null;

export async function drawCardsFromDB(
  count: number,
  majorOnly = false,
): Promise<Array<TarotCardData & { isReversed: boolean }>> {
  if (!deckCache) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL as string,
      import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    );

    const query = supabase
      .from('tarot_cards')
      .select('*')
      .order('id');

    if (majorOnly) query.eq('arcana', 'major');

    const { data, error } = await query;
    if (error || !data?.length) {
      console.warn('[DB] 타로 카드 조회 실패, 로컬 데이터 사용:', error?.message);
      return drawCards(count, majorOnly);
    }

    deckCache = data.map(row => ({
      id:     row.id,
      name:   row.name,
      nameKo: row.name_ko,
      arcana: row.arcana as 'major' | 'minor',
      suit:   row.suit ?? undefined,
      emoji:  row.emoji,
    }));
  }

  const deck = majorOnly
    ? deckCache.filter(c => c.arcana === 'major').slice()
    : deckCache.slice();

  // Fisher-Yates 셔플
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck.slice(0, count).map(card => ({
    ...card,
    isReversed: Math.random() > 0.5,
  }));
}
