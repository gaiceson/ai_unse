import { useState, useCallback, useEffect, useRef } from 'react';
import { getSpreadCards, getTarotReading, type SpreadType, type DrawnCard, type TarotReadingResult } from '../services/tarot';
import { PageHeader } from '../components/PageHeader';
import { TarotCard } from '../components/TarotCard';
import { AdRewardGate } from '../components/AdRewardGate';
import { PaymentButton } from '../components/PaymentButton';
import { ShareCard } from '../components/ShareCard';
import { useDailyLimit, useFortuneHistory } from '../hooks/useStorage';
import { BannerAd } from '../components/BannerAd';

const SHUFFLE_STYLE = `
@keyframes tarot-shuffle {
  0%   { transform: translateX(0px) translateY(0px) rotate(0deg); }
  20%  { transform: translateX(var(--sx)) translateY(var(--sy)) rotate(var(--sr)); }
  50%  { transform: translateX(calc(var(--sx) * -0.5)) translateY(-12px) rotate(calc(var(--sr) * -0.6)); }
  80%  { transform: translateX(var(--sx)) translateY(var(--sy)) rotate(var(--sr)); }
  100% { transform: translateX(0px) translateY(0px) rotate(0deg); }
}
@keyframes tarot-card-in {
  from { opacity: 0; transform: translateY(40px) scale(0.9); }
  to   { opacity: 1; transform: translateY(0px) scale(1); }
}
`;

const LOADING_MESSAGES = [
  { icon: '🔮', text: '카드가 뭔 말 하는지 해석 중이에요' },
  { icon: '✨', text: '솔직하게 말해줄 메시지 고르는 중이에요' },
  { icon: '🌙', text: '카드들 사이 연결고리 찾는 중이에요' },
  { icon: '🃏', text: '팩폭 준비 완료 직전이에요' },
  { icon: '💫', text: '좋은 것도 나쁜 것도 다 담는 중이에요' },
  { icon: '🌟', text: '핵심 메시지 다듬는 중이에요' },
  { icon: '✨', text: '거의 다 됐어요. 각오 되셨나요?' },
];

const TAROT_TIPS = [
  '역방향 카드는 나쁜 게 아니에요. 그 에너지가 내면으로 향한다는 뜻이에요.',
  '타로는 미래를 확정하는 게 아니라 지금의 흐름을 보여줘요.',
  '자꾸 같은 카드가 나온다면, 그 메시지를 아직 받아들이지 않은 거예요.',
  '타로에서 카드 자체보다 카드들의 조합이 더 중요해요.',
  '같은 카드라도 질문에 따라 의미가 완전히 달라져요.',
  '카드에 찔리는 느낌이 들면, 그게 맞는 거예요. 직관을 믿으세요.',
];

const EXAMPLE_QUESTIONS = [
  '이번 주 나에게 어떤 에너지가 올까?',
  '지금 마음에 두고 있는 사람, 어떻게 될까?',
  '요즘 고민하고 있는 일, 어떤 방향이 좋을까?',
  '이번 달 나의 행운 포인트는?',
  '지금 내가 놓치고 있는 것이 있을까?',
  '새로운 도전을 시작해도 괜찮을까?',
];

// ── 카드 키워드 (로딩 중 미리 표시용) ────────────────────────
const MAJOR_KEYWORDS: Record<number, { upright: string; reversed: string }> = {
  0:  { upright: '새로운 시작, 자유, 순수한 가능성',    reversed: '무모함, 경솔한 결정, 방황' },
  1:  { upright: '의지력, 창의성, 강한 실행력',         reversed: '재능 낭비, 속임수, 자기 의심' },
  2:  { upright: '직관, 내면의 지혜, 신비',             reversed: '비밀, 감춰진 진실, 혼란' },
  3:  { upright: '풍요, 창조, 모성적 에너지',           reversed: '의존성, 창의력 막힘, 불안' },
  4:  { upright: '안정, 권위, 리더십',                  reversed: '통제 집착, 경직성, 권위 남용' },
  5:  { upright: '전통, 가르침, 정신적 지침',           reversed: '반항, 독단, 새로운 방식 추구' },
  6:  { upright: '사랑, 선택, 조화로운 관계',           reversed: '불균형, 잘못된 선택, 갈등' },
  7:  { upright: '의지로 이룬 승리, 자제력, 집중',      reversed: '방향 상실, 공격성, 통제 부족' },
  8:  { upright: '내면의 강인함, 인내, 용기',           reversed: '자기 의심, 나약함, 에너지 고갈' },
  9:  { upright: '내면 탐구, 성찰, 지혜 추구',         reversed: '고립, 외로움, 자기 폐쇄' },
  10: { upright: '운명의 전환, 행운, 새로운 국면',      reversed: '불운, 저항, 변화 거부' },
  11: { upright: '공정함, 균형, 진실',                  reversed: '불공정, 편견, 부정직' },
  12: { upright: '희생, 새로운 시각, 기다림',           reversed: '자기희생 거부, 지연, 집착' },
  13: { upright: '변화, 끝과 새 시작, 전환',            reversed: '변화 저항, 정체, 두려움' },
  14: { upright: '절제, 균형, 인내와 조화',             reversed: '과잉, 불균형, 극단적 행동' },
  15: { upright: '집착, 물질 욕망, 束縛',              reversed: '해방, 집착에서 벗어남' },
  16: { upright: '갑작스러운 변화, 붕괴, 각성',         reversed: '위기 회피, 내면의 혼란' },
  17: { upright: '희망, 영감, 치유와 평화',             reversed: '희망 상실, 실망, 방향 부재' },
  18: { upright: '무의식, 환상, 불확실성',              reversed: '혼란 극복, 두려움 직면' },
  19: { upright: '성공, 활력, 밝은 에너지',             reversed: '에너지 저하, 낙관 부족' },
  20: { upright: '부활, 깨달음, 새 출발 신호',          reversed: '자기 의심, 판단 회피' },
  21: { upright: '완성, 달성, 충만함',                  reversed: '미완성, 지연, 순환 반복' },
};

const SUIT_KEYWORDS: Record<string, { upright: string; reversed: string }> = {
  wands:     { upright: '열정, 행동력, 창의적 에너지',  reversed: '지연, 갈등, 방향 상실' },
  cups:      { upright: '감정, 사랑, 직관과 연결',      reversed: '감정 억압, 실망, 관계 문제' },
  swords:    { upright: '명확한 사고, 진실, 결단력',    reversed: '혼란, 갈등, 잘못된 판단' },
  pentacles: { upright: '현실, 물질적 안정, 성실함',   reversed: '물질적 손실, 욕심, 정체' },
};

function getCardKeyword(card: DrawnCard): string {
  if (card.arcana === 'major') {
    const kw = MAJOR_KEYWORDS[card.id];
    return kw ? (card.isReversed ? kw.reversed : kw.upright) : '';
  }
  const kw = SUIT_KEYWORDS[card.suit ?? ''];
  return kw ? (card.isReversed ? kw.reversed : kw.upright) : '';
}

const POSITION_LABELS: Record<SpreadType, string[]> = {
  single: ['선택한 카드'],
  three:  ['과거', '현재', '미래'],
  celtic: ['현재 상황', '장애물', '의식', '무의식', '과거', '가까운 미래', '자신', '환경', '희망/두려움', '결과'],
};

const SPREADS: Array<{ type: SpreadType; label: string; desc: string }> = [
  { type: 'single', label: '원카드', desc: '빠른 답변, 1장' },
  { type: 'three', label: '쓰리카드', desc: '과거, 현재, 미래' },
];

// 셔플 카드 오프셋 (7장)
const SHUFFLE_CARDS = [
  { sx: '-70px', sy: '4px',  sr: '-22deg', delay: '0s' },
  { sx: '-42px', sy: '-6px', sr: '-12deg', delay: '0.08s' },
  { sx: '-16px', sy: '2px',  sr: '-4deg',  delay: '0.16s' },
  { sx: '0px',   sy: '-4px', sr: '0deg',   delay: '0.22s' },
  { sx: '16px',  sy: '2px',  sr: '4deg',   delay: '0.16s' },
  { sx: '42px',  sy: '-6px', sr: '12deg',  delay: '0.08s' },
  { sx: '70px',  sy: '4px',  sr: '22deg',  delay: '0s' },
];

export function TarotPage() {
  const [step, setStep] = useState<'spread' | 'question' | 'shuffle' | 'draw' | 'loading' | 'result' | 'gate'>('spread');
  const [spreadType, setSpreadType] = useState<SpreadType>('single');
  const [question, setQuestion] = useState('');
  const [cards, setCards] = useState<DrawnCard[]>([]);
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<TarotReadingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [loadingStage, setLoadingStage] = useState(0);
  const [streamProgress, setStreamProgress] = useState(0);
  const [dotCount, setDotCount] = useState(1);
  const [tipIdx] = useState(() => Math.floor(Math.random() * TAROT_TIPS.length));
  const loadingMsgRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { canUse, increment } = useDailyLimit('tarot', 1);
  const { addHistory } = useFortuneHistory();

  // 로딩 메시지 순환 + 단계 추적
  useEffect(() => {
    if (step === 'loading') {
      setLoadingMsgIdx(0);
      setLoadingStage(0);
      setDotCount(1);
      let msgIdx = 0;
      let stage = 0;
      loadingMsgRef.current = setInterval(() => {
        msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length;
        setLoadingMsgIdx(msgIdx);
        if (msgIdx % 2 === 0 && stage < 3) {
          stage = Math.min(stage + 1, 3);
          setLoadingStage(stage);
        }
        setDotCount(d => (d % 3) + 1);
      }, 2200);
    } else {
      if (loadingMsgRef.current) clearInterval(loadingMsgRef.current);
    }
    return () => { if (loadingMsgRef.current) clearInterval(loadingMsgRef.current); };
  }, [step]);

  // 셔플 애니메이션 완료 후 draw로 전환
  useEffect(() => {
    if (step !== 'shuffle') return;
    const t = setTimeout(() => setStep('draw'), 2600);
    return () => clearTimeout(t);
  }, [step]);

  const selectSpread = (type: SpreadType) => {
    setSpreadType(type);
    if (!canUse) {
      setStep('gate');
    } else {
      setStep('question');
    }
  };

  const handleQuestionSubmit = async () => {
    if (!question.trim()) return;
    const drawn = await getSpreadCards(spreadType);
    setCards(drawn);
    setRevealedIndices(new Set());
    setStep('shuffle'); // shuffle 먼저
  };

  const revealCard = useCallback((index: number) => {
    setRevealedIndices(prev => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, []);

  const allRevealed = revealedIndices.size === cards.length;

  const fetchReading = async () => {
    setStep('loading');
    setError(null);
    setStreamProgress(0);
    try {
      const reading = await getTarotReading(question, cards, spreadType, (partial) => {
        setStreamProgress(Math.min(95, Math.round((partial.length / 800) * 100)));
      });
      setResult(reading);
      increment();
      addHistory({ type: '타로 리딩', summary: reading.keyMessage });
      setStep('result');
    } catch {
      setError('타로 해석에 실패했어요.');
      setStep('draw');
    }
  };

  const handleGateUnlock = () => setStep('question');

  const handleRetry = () => {
    setQuestion('');
    setCards([]);
    setRevealedIndices(new Set());
    setResult(null);
    setError(null);
    setStep(canUse ? 'spread' : 'gate');
  };

  // ── Spread selection ──────────────────────────────────────
  if (step === 'spread') {
    return (
      <div className="page">
        <PageHeader title="타로 리딩" />
        <p className="text-caption" style={{ marginBottom: '20px' }}>
          마음속 질문을 떠올리고 카드를 선택하세요
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {SPREADS.map(s => (
            <button
              key={s.type}
              className="card"
              onClick={() => selectSpread(s.type)}
              style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
            >
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'var(--color-primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', flexShrink: 0,
              }}>🃏</div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>{s.label}</div>
                <div className="text-caption">{s.desc}</div>
              </div>
            </button>
          ))}
        </div>
        {!canUse && (
          <p className="text-caption" style={{ textAlign: 'center', marginTop: '16px' }}>
            오늘의 무료 리딩을 모두 사용했어요
          </p>
        )}
      </div>
    );
  }

  // ── Gate ──────────────────────────────────────────────────
  if (step === 'gate') {
    return (
      <div className="page">
        <PageHeader title="타로 리딩" />
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
            오늘의 무료 리딩을 사용했어요
          </h2>
          <p className="text-caption" style={{ marginBottom: '24px' }}>
            광고를 시청하거나 구매해서 추가 리딩을 받을 수 있어요
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <AdRewardGate onRewarded={handleGateUnlock} buttonText="광고 보고 추가 리딩" />
            <div style={{ position: 'relative', textAlign: 'center', margin: '4px 0' }}>
              <span className="text-caption" style={{ background: 'var(--bg-card)', padding: '0 12px', position: 'relative', zIndex: 1 }}>또는</span>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--color-divider)' }} />
            </div>
            <PaymentButton sku="ait.0000021209.41ffef4d.d04934f5b4.3251499485" label="추가 리딩 · 550원" onSuccess={handleGateUnlock} />
          </div>
        </div>
      </div>
    );
  }

  // ── Question input ────────────────────────────────────────
  if (step === 'question') {
    return (
      <div className="page">
        <PageHeader title="타로 리딩" />
        <div className="card" style={{ marginBottom: '12px' }}>
          <h3 className="section-title">마음속 질문을 입력하세요</h3>
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="직접 입력하거나 아래 예시를 선택하세요"
            className="input-field"
            style={{ minHeight: '80px', resize: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
          {EXAMPLE_QUESTIONS.map(q => (
            <button
              key={q}
              onClick={() => setQuestion(q)}
              style={{
                padding: '8px 14px', borderRadius: '20px',
                border: question === q ? '1.5px solid var(--color-primary)' : '1px solid var(--color-divider)',
                background: question === q ? 'var(--color-primary-light)' : 'var(--bg-card)',
                color: question === q ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
              }}
            >{q}</button>
          ))}
        </div>
        <button className="btn-primary" onClick={handleQuestionSubmit} disabled={!question.trim()}>
          카드 뽑기
        </button>
      </div>
    );
  }

  // ── Shuffle animation ─────────────────────────────────────
  if (step === 'shuffle') {
    return (
      <div className="page">
        <style>{SHUFFLE_STYLE}</style>
        <PageHeader title="타로 리딩" />
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          minHeight: '60vh', gap: '32px',
        }}>
          {/* 셔플 카드 덱 */}
          <div style={{ position: 'relative', width: '90px', height: '140px' }}>
            {SHUFFLE_CARDS.map((c, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: '80px',
                  height: '120px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  boxShadow: '0 4px 16px rgba(79,70,229,0.35)',
                  left: '5px',
                  top: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  // CSS 변수로 각 카드마다 다른 오프셋
                  ['--sx' as any]: c.sx,
                  ['--sy' as any]: c.sy,
                  ['--sr' as any]: c.sr,
                  animation: `tarot-shuffle 1.1s ease-in-out ${c.delay} infinite`,
                }}
              >
                <div style={{
                  width: '55px', height: '80px', borderRadius: '6px',
                  border: '1.5px solid rgba(255,255,255,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '22px', opacity: 0.6 }}>✦</span>
                </div>
              </div>
            ))}
          </div>

          {/* 텍스트 */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '17px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
              카드를 섞고 있습니다
            </p>
            <p className="text-caption">당신의 질문에 맞는 카드를 고르는 중...</p>
          </div>

          {/* 펄스 도트 */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: 'var(--color-primary)',
                animation: `tarot-shuffle 0.9s ease-in-out ${i * 0.2}s infinite`,
                opacity: 0.7,
              }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Card draw ─────────────────────────────────────────────
  if (step === 'draw') {
    return (
      <div className="page">
        <style>{SHUFFLE_STYLE}</style>
        <PageHeader title="타로 리딩" />
        <p className="text-caption" style={{ marginBottom: '28px', textAlign: 'center' }}>
          카드를 터치해서 뒤집어 주세요
        </p>

        {/* 카드 위치 레이블 (3장일 때) */}
        {cards.length === 3 && (
          <div style={{
            display: 'flex', justifyContent: 'center', gap: '16px',
            marginBottom: '8px',
          }}>
            {['과거', '현재', '미래'].map(label => (
              <div key={label} style={{
                width: '110px', textAlign: 'center',
                fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600,
                letterSpacing: '0.05em',
              }}>{label}</div>
            ))}
          </div>
        )}

        {/* 카드들 — 슬라이드인 애니메이션 */}
        <div style={{
          display: 'flex', justifyContent: 'center',
          gap: '16px', flexWrap: 'wrap', marginBottom: '28px',
        }}>
          {cards.map((card, i) => (
            <div
              key={card.id}
              style={{
                animation: `tarot-card-in 0.5s ease-out ${i * 0.15}s both`,
              }}
            >
              <TarotCard
                card={card}
                revealed={revealedIndices.has(i)}
                onClick={() => revealCard(i)}
                size={cards.length === 1 ? 'large' : 'medium'}
              />
            </div>
          ))}
        </div>

        {error && (
          <p style={{ color: 'var(--color-danger)', textAlign: 'center', marginBottom: '12px' }}>{error}</p>
        )}

        {allRevealed ? (
          <button className="btn-primary" onClick={fetchReading}>
            AI 해석 받기
          </button>
        ) : (
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            {revealedIndices.size} / {cards.length} 공개됨
          </p>
        )}
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────
  if (step === 'loading') {
    const positions = POSITION_LABELS[spreadType];
    const msg = LOADING_MESSAGES[loadingMsgIdx];
    const dots = '.'.repeat(dotCount);
    const STAGES = ['카드 파악', '흐름 분석', '메시지 정리', '마무리'];

    return (
      <div className="page">
        <style>{SHUFFLE_STYLE}</style>
        <PageHeader title="타로 리딩" />

        {/* 단계 표시 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '20px' }}>
          {STAGES.map((label, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                {i > 0 && (
                  <div style={{
                    flex: 1, height: '2px',
                    background: i <= loadingStage ? 'var(--color-primary)' : 'var(--color-divider)',
                    transition: 'background 0.4s ease',
                  }} />
                )}
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  background: i < loadingStage ? 'var(--color-primary)' : i === loadingStage ? 'var(--color-primary)' : 'var(--color-divider)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.4s ease',
                  boxShadow: i === loadingStage ? '0 0 0 4px var(--color-primary-light)' : 'none',
                }}>
                  {i < loadingStage ? (
                    <span style={{ fontSize: '13px', color: '#fff' }}>✓</span>
                  ) : (
                    <span style={{ fontSize: '11px', color: i === loadingStage ? '#fff' : 'var(--color-text-secondary)', fontWeight: 700 }}>{i + 1}</span>
                  )}
                </div>
                {i < STAGES.length - 1 && (
                  <div style={{
                    flex: 1, height: '2px',
                    background: i < loadingStage ? 'var(--color-primary)' : 'var(--color-divider)',
                    transition: 'background 0.4s ease',
                  }} />
                )}
              </div>
              <span style={{
                fontSize: '10px', fontWeight: i === loadingStage ? 700 : 500,
                color: i <= loadingStage ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                transition: 'all 0.4s ease',
                whiteSpace: 'nowrap',
              }}>{label}</span>
            </div>
          ))}
        </div>

        {/* 선택된 카드 */}
        <div style={{ marginBottom: '16px' }}>
          {cards.map((card, i) => (
            <div
              key={card.id}
              className="card"
              style={{
                marginBottom: '10px',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start',
                animation: `tarot-card-in 0.4s ease-out ${i * 0.12}s both`,
              }}
            >
              <div style={{
                flexShrink: 0,
                width: '48px', height: '68px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '2px',
              }}>
                <span style={{ fontSize: '22px' }}>{card.emoji}</span>
                {card.isReversed && (
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)' }}>역방향</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 700,
                    color: 'var(--color-primary)',
                    background: 'var(--color-primary-light)',
                    padding: '2px 6px', borderRadius: '4px',
                  }}>{positions[i] ?? `카드 ${i + 1}`}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
                    {card.nameKo}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {getCardKeyword(card)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 상태 메시지 + 진행바 */}
        <div style={{
          padding: '16px',
          borderRadius: '14px',
          background: 'var(--bg-card)',
          border: '1px solid var(--color-divider)',
          marginBottom: '12px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '28px', marginBottom: '8px', animation: 'tarot-pulse 1.4s ease-in-out infinite' }}>
            {msg.icon}
          </div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '12px' }}>
            {msg.text.replace(/이에요$/, `이에요${dots}`)}
          </p>
          <div style={{
            height: '6px',
            background: 'var(--color-divider)',
            borderRadius: '3px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: streamProgress > 0 ? `${streamProgress}%` : `${25 + loadingStage * 20}%`,
              background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
              borderRadius: '3px',
              transition: 'width 0.5s ease',
            }} />
          </div>
          {streamProgress > 0 && (
            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
              {streamProgress}% 생성 중
            </p>
          )}
        </div>

        {/* 타로 팁 */}
        <div style={{
          padding: '14px 16px',
          borderRadius: '12px',
          background: 'var(--bg-card)',
          border: '1px solid var(--color-divider)',
        }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '5px' }}>
            🃏 타로 상식
          </p>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
            {TAROT_TIPS[tipIdx]}
          </p>
        </div>

        <style>{`
          @keyframes tarot-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.15); }
          }
        `}</style>
      </div>
    );
  }

  // ── Result ────────────────────────────────────────────────
  if (step === 'result' && result) {
    return (
      <div className="page">
        <PageHeader title="타로 리딩 해석" />

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
          {cards.map(card => (
            <TarotCard key={card.id} card={card} revealed size="small" />
          ))}
        </div>

        <div className="card" style={{ marginBottom: '12px', textAlign: 'center' }}>
          <span className="text-caption">질문</span>
          <p style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px' }}>{question}</p>
        </div>

        {result.cards.map((c, i) => (
          <div key={i} className="card animate-fade-in" style={{ marginBottom: '12px', animationDelay: `${i * 150}ms`, animationFillMode: 'backwards' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 700 }}>{c.position}</span>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{c.name}</span>
            </div>
            <p className="text-body" style={{ lineHeight: 1.7 }}>{c.interpretation}</p>
          </div>
        ))}

        <div className="card" style={{ marginBottom: '12px' }}>
          <h3 className="section-title">종합 해석</h3>
          <p className="text-body" style={{ lineHeight: 1.7 }}>{result.overall}</p>
        </div>

        {result.action && (
          <div className="card" style={{ marginBottom: '12px' }}>
            <h3 className="section-title">✅ 지금 해야 할 행동</h3>
            <p className="text-body" style={{ lineHeight: 1.8 }}>{result.action}</p>
          </div>
        )}

        {result.caution && (
          <div className="card" style={{ marginBottom: '12px' }}>
            <h3 className="section-title">⚠️ 주의할 점</h3>
            <p className="text-body" style={{ lineHeight: 1.8 }}>{result.caution}</p>
          </div>
        )}

        {result.timing && (
          <div className="card" style={{ marginBottom: '12px' }}>
            <h3 className="section-title">⏰ 변화의 타이밍</h3>
            <p className="text-body">{result.timing}</p>
          </div>
        )}

        <div className="card" style={{ marginBottom: '20px', background: 'var(--color-primary-light)', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)' }}>
            {result.keyMessage}
          </p>
          <p className="text-caption" style={{ marginTop: '8px' }}>{result.advice}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <ShareCard
            title="타로 리딩"
            message={[
              `❓ 질문: ${question}`,
              ...result.cards.map(c => `🃏 ${c.position} - ${c.name}:\n${c.interpretation}`),
              `📖 종합 해석:\n${result.overall}`,
              result.action   ? `✅ 지금 해야 할 행동:\n${result.action}` : '',
              result.caution  ? `⚠️ 주의할 점:\n${result.caution}` : '',
              result.timing   ? `⏰ 변화의 타이밍: ${result.timing}` : '',
              `✨ ${result.keyMessage}`,
              `💡 ${result.advice}`,
            ].filter(Boolean).join('\n\n')}
            type="타로 리딩"
          />
          <button className="btn-secondary" onClick={handleRetry}>다시 뽑기</button>
          <BannerAd />
        </div>
      </div>
    );
  }

  return null;
}
