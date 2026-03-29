import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { getConsultAnswer, type ConsultResult } from '../services/consult';
import { useBirthday, useDailyLimit } from '../hooks/useStorage';
import { usePayment } from '../hooks/usePayment';
import { AdRewardGate } from '../components/AdRewardGate';
import { PaymentButton } from '../components/PaymentButton';
import { ShareCard } from '../components/ShareCard';

const SESSION_KEY = 'consult_session';

function saveSession(q: string, r: ConsultResult) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ q, r }));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

const HOT_QUESTIONS = [
  { label: '올해 이직운', question: '올해 이직하면 좋을까요?' },
  { label: '연애운 상승 시기', question: '내 연애운 언제 좋아질까요?' },
  { label: '재물운 흐름', question: '지금 투자 괜찮을까요?' },
  { label: '올해 건강운', question: '올해 건강운은 어떤가요?' },
  { label: '인간관계 운세', question: '올해 인간관계 운세는 어떤가요?' },
];

const EXAMPLE_QUESTIONS = [
  '나 올해 이직 고민 중인데 사주에서 뭐라고 해?',
  '연애운 언제 터지냐... 진짜 기다리다 지쳐 ㅠ',
  '요즘 돈이 너무 안 들어오는데 재물운 어때?',
  '지금 투자해도 되는 타이밍임? 아니면 존버?',
  '올해 내 인간관계 운 솔직하게 팩폭해줘',
];

function getExtraCount(): number {
  try {
    const d = localStorage.getItem('consult_extra');
    return d ? (JSON.parse(d) as { count: number }).count : 0;
  } catch { return 0; }
}

function saveExtraCount(n: number) {
  localStorage.setItem('consult_extra', JSON.stringify({ count: Math.max(0, n) }));
}

type Step = 'home' | 'loading' | 'result' | 'gate';

export function ConsultPage() {
  const navigate = useNavigate();
  const { birthday } = useBirthday();
  const { canUse, increment } = useDailyLimit('consult', 1);
  const { canUse: canWatchAd, increment: incrementAd } = useDailyLimit('consult_ad', 1);
  const [extra, setExtra] = useState(() => getExtraCount());

  const [step, setStep] = useState<Step>('home');
  const [input, setInput] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [result, setResult] = useState<ConsultResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 게이트 통과 후 결제 중 remount 시 sessionStorage로 결과 복원
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (!saved) return;
    try {
      const { q, r } = JSON.parse(saved) as { q: string; r: ConsultResult };
      if (q && r) {
        setCurrentQuestion(q);
        setResult(r);
        setStep('result');
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canAsk = canUse || extra > 0;

  const doAsk = async (question: string) => {
    setCurrentQuestion(question);
    setInput('');
    setStep('loading');
    setError(null);
    try {
      const res = await getConsultAnswer(question, birthday ?? undefined);
      setResult(res);
      saveSession(question, res);
      setStep('result');
    } catch {
      setError('일시적인 오류가 발생했어요. 다시 시도해 주세요.');
      setStep('home');
    }
  };

  const handleAsk = (question: string) => {
    if (!question.trim()) return;
    if (!canAsk) {
      setCurrentQuestion(question);
      setStep('gate');
      return;
    }
    if (canUse) {
      increment();
    } else {
      const n = extra - 1;
      setExtra(n);
      saveExtraCount(n);
    }
    doAsk(question);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAsk(input);
  };

  // 광고 시청 후 바로 질문 진행 (1회 소비)
  const handleAdUnlock = () => {
    incrementAd();
    if (currentQuestion) doAsk(currentQuestion);
    else setStep('home');
  };

  // 1회 결제 후 질문 진행
  const handleSingleUnlock = () => {
    if (currentQuestion) doAsk(currentQuestion);
    else setStep('home');
  };

  // 3회 패키지: 1회 즉시 사용 + 2회 잔여
  const handlePackUnlock = () => {
    const n = extra + 2;
    setExtra(n);
    saveExtraCount(n);
    if (currentQuestion) doAsk(currentQuestion);
    else setStep('home');
  };

  const handleReset = () => {
    clearSession();
    setStep('home');
    setResult(null);
    setCurrentQuestion('');
  };

  // No birthday
  if (!birthday) {
    return (
      <div className="page">
        <PageHeader title="AI 운세 상담" />
        <div className="card" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>🔮</div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>생년월일이 필요해요</h2>
          <p className="text-caption" style={{ marginBottom: '24px' }}>
            사주 상담을 위해 생년월일을 먼저 입력해 주세요
          </p>
          <button className="btn-primary" onClick={() => navigate('/fortune')}>
            생년월일 입력하기
          </button>
        </div>
      </div>
    );
  }

  // Loading
  if (step === 'loading') {
    return <ConsultLoadingScreen question={currentQuestion} />;
  }

  // Gate — 질문 횟수 소진 시
  if (step === 'gate') {
    return (
      <div className="page">
        <PageHeader title="AI 운세 상담" />
        <div className="card" style={{ marginBottom: '12px', padding: '12px 16px', background: 'var(--color-primary-light)' }}>
          <p style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600, marginBottom: '4px' }}>질문</p>
          <p style={{ fontSize: '14px', color: 'var(--color-text)' }}>{currentQuestion}</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '32px 20px', marginBottom: '16px' }}>
          <div style={{ fontSize: '44px', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
            오늘의 무료 상담을 사용했어요
          </h2>
          <p className="text-caption" style={{ marginBottom: '24px' }}>
            광고 시청 또는 결제로 추가 상담을 받을 수 있어요
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {canWatchAd ? (
              <>
                <AdRewardGate onRewarded={handleAdUnlock} buttonText="광고 보고 1회 질문" />
                <Divider />
              </>
            ) : (
              <p className="text-caption" style={{ textAlign: 'center', padding: '4px 0' }}>
                오늘 광고는 이미 사용했어요
              </p>
            )}
            <PaymentButton
              sku="ait.0000021209.2220458c.e789367624.3340251676"
              label="1회 질문 · 2,200원"
              onSuccess={handleSingleUnlock}
            />
            <PackageButton onSuccess={handlePackUnlock} />
          </div>
        </div>
        <button className="btn-secondary" onClick={() => setStep('home')}>
          돌아가기
        </button>
      </div>
    );
  }

  // Result — 전체 답변 공개
  if (step === 'result' && result) {
    return (
      <div className="page">
        <PageHeader title="AI 운세 상담" />

        {/* Question badge */}
        <div className="card" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px' }}>
          <span style={{ fontSize: '18px' }}>💬</span>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>{currentQuestion}</p>
        </div>

        {/* Birth info */}
        <div style={{
          marginBottom: '12px',
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'var(--color-primary-light)',
          border: '1px solid var(--color-primary-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span style={{ fontSize: '16px' }}>📅</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>
              {birthday.year}년 {birthday.month}월 {birthday.day}일생
            </span>
            {birthday.hour !== undefined && (
              <span style={{ fontSize: '12px', color: 'var(--color-primary)', opacity: 0.8 }}>
                · {birthday.hour}시생
              </span>
            )}
            {birthday.gender && (
              <span style={{ fontSize: '12px', color: 'var(--color-primary)', opacity: 0.8 }}>
                · {birthday.gender === 'male' ? '남성' : '여성'}
              </span>
            )}
            <span style={{ fontSize: '12px', color: 'var(--color-primary)', opacity: 0.7 }}>
              기준 사주 분석
            </span>
          </div>
        </div>

        {/* Full answer */}
        <div className="card animate-fade-in" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '18px' }}>🔮</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)' }}>AI 사주 운세 상담</span>
          </div>
          <p style={{ fontSize: '15px', lineHeight: 1.85, color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}>
            {result.free}
          </p>
          <div style={{ height: '1px', background: 'var(--color-divider)', margin: '16px 0' }} />
          <p style={{ fontSize: '15px', lineHeight: 1.85, color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}>
            {result.paid}
          </p>
        </div>

        {/* Bottom actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <ShareCard
            title="AI 운세 상담"
            message={[
              `❓ ${currentQuestion}`,
              result.free,
              result.paid,
            ].filter(Boolean).join('\n\n')}
            type="AI 운세 상담"
          />
          <button className="btn-secondary" onClick={handleReset}>
            다시 질문하기
          </button>
          {!canAsk && (
            <p className="text-caption" style={{ textAlign: 'center' }}>
              오늘의 무료 상담을 사용했어요 · 내일 다시 무료로 이용 가능
            </p>
          )}
        </div>
      </div>
    );
  }

  // Home
  return (
    <div className="page">
      <h1 className="page-title">AI 운세 상담</h1>

      {error && (
        <div style={{
          marginBottom: '16px', padding: '12px 16px', borderRadius: '12px',
          background: '#FEF2F2', color: 'var(--color-danger)', fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      {/* Hot questions */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '10px' }}>
          🔥 오늘 가장 많이 묻는 질문
        </p>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {HOT_QUESTIONS.map(({ label, question }) => (
            <button
              key={label}
              onClick={() => handleAsk(question)}
              style={{
                flexShrink: 0,
                padding: '8px 14px',
                borderRadius: '20px',
                background: 'var(--bg-card)',
                border: '1px solid var(--color-divider)',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--color-text)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Input card */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <h3 className="section-title" style={{ marginBottom: '6px' }}>무엇이든 물어보세요</h3>
        <p className="text-caption" style={{ marginBottom: '14px' }}>
          생년월일 기반 사주 분석 · 20년 경력 AI 상담사
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="예: 올해 이직하면 좋을까요?"
            className="input-field"
            style={{ minHeight: '100px', resize: 'none' }}
          />
          <button className="btn-primary" type="submit" disabled={!input.trim()}>
            {canAsk ? '운세 상담 시작' : '상담권 구매 후 이용'}
          </button>
        </form>
      </div>

      {/* Example questions */}
      <div style={{ marginBottom: '20px' }}>
        <p className="text-caption" style={{ marginBottom: '8px' }}>추천 질문</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {EXAMPLE_QUESTIONS.map(q => (
            <button
              key={q}
              onClick={() => handleAsk(q)}
              style={{
                textAlign: 'left',
                padding: '13px 16px',
                borderRadius: '12px',
                background: 'var(--bg-card)',
                border: '1px solid var(--color-divider)',
                fontSize: '14px',
                color: 'var(--color-text)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span style={{ color: 'var(--color-primary)', fontSize: '16px' }}>🔮</span>
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Daily limit notice */}
      {!canAsk && (
        <div className="card" style={{
          textAlign: 'center',
          background: 'var(--color-primary-light)',
          border: '1px solid var(--color-primary-border)',
        }}>
          <p style={{ fontSize: '14px', color: 'var(--color-primary)', fontWeight: 700 }}>
            오늘의 무료 상담을 사용했어요
          </p>
          <p className="text-caption" style={{ marginTop: '4px' }}>
            내일 다시 무료로 이용하거나 추가 상담권을 구매할 수 있어요
          </p>
        </div>
      )}
    </div>
  );
}

const LOADING_STEPS = [
  {
    icon: '🔮',
    title: '사주 기운 파악 중...',
    sub: '생년월일로 사주팔자를 계산하고 있어요',
  },
  {
    icon: '🌙',
    title: '운세 흐름 분석 중...',
    sub: '올해 어떤 기운이 흐르는지 살펴보는 중이에요',
  },
  {
    icon: '💫',
    title: '핵심 포인트 정리 중...',
    sub: '솔직한 팩폭 준비 중... 각오 되셨나요?',
  },
  {
    icon: '✨',
    title: '답변 마무리 중...',
    sub: '거의 다 됐어요. 조금만 더 기다려 주세요',
  },
];

const LOADING_TIPS = [
  '사주에서 올해 운세는 생년월일과 연도의 기운이 만나는 지점에서 나와요',
  '운세는 타고난 기운이지만, 어떻게 쓰느냐는 본인 몫이에요',
  '좋은 운세라도 준비된 사람한테만 찾아온다는 말, 사주에서도 맞아요',
  '사주에서 제일 중요한 건 일주예요. 태어난 날의 기운이 성격을 결정해요',
  '운세가 안 좋은 시기도 어떻게 버티느냐에 따라 결과가 달라져요',
];

function ConsultLoadingScreen({ question }: { question: string }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [tipIdx] = useState(() => Math.floor(Math.random() * LOADING_TIPS.length));
  const [dotCount, setDotCount] = useState(1);
  const stepRef = useRef(0);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      stepRef.current = Math.min(stepRef.current + 1, LOADING_STEPS.length - 1);
      setStepIdx(stepRef.current);
    }, 2800);
    const dotTimer = setInterval(() => {
      setDotCount(d => (d % 3) + 1);
    }, 500);
    return () => {
      clearInterval(stepTimer);
      clearInterval(dotTimer);
    };
  }, []);

  const step = LOADING_STEPS[stepIdx];
  const dots = '.'.repeat(dotCount);

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh' }}>
      {/* Question badge */}
      <div style={{
        padding: '12px 16px',
        borderRadius: '12px',
        background: 'var(--color-primary-light)',
        border: '1px solid var(--color-primary-border)',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
      }}>
        <span style={{ fontSize: '16px', flexShrink: 0 }}>💬</span>
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)', lineHeight: 1.5 }}>
          {question}
        </p>
      </div>

      {/* Main loading area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        {/* Animated icon */}
        <div style={{
          fontSize: '64px',
          animation: 'pulse 1.5s ease-in-out infinite',
          lineHeight: 1,
        }}>
          {step.icon}
        </div>

        {/* Status text */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '6px' }}>
            {step.title.replace('...', dots)}
          </p>
          <p className="text-caption" style={{ fontSize: '13px' }}>
            {step.sub}
          </p>
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          {LOADING_STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === stepIdx ? '20px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: i <= stepIdx ? 'var(--color-primary)' : 'var(--color-divider)',
                transition: 'all 0.4s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* Tip card */}
      <div style={{
        padding: '16px',
        borderRadius: '14px',
        background: 'var(--bg-card)',
        border: '1px solid var(--color-divider)',
        marginTop: '32px',
      }}>
        <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '6px' }}>
          💡 잠깐, 알고 계셨나요?
        </p>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          {LOADING_TIPS[tipIdx]}
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.12); opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}

function PackageButton({ onSuccess }: { onSuccess: () => void }) {
  const { purchase } = usePayment();
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const orderId = await purchase('ait.0000021209.d50f8e45.6613109a42.3340336715');
      if (orderId) onSuccess();
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* 추천 배지 */}
      <div style={{
        position: 'absolute',
        top: '-11px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--color-gold)',
        color: '#fff',
        fontSize: '11px',
        fontWeight: 800,
        padding: '3px 12px',
        borderRadius: '20px',
        whiteSpace: 'nowrap',
        zIndex: 1,
      }}>
        ⭐ 가장 인기
      </div>
      <button
        onClick={handlePurchase}
        disabled={purchasing}
        style={{
          width: '100%',
          padding: '18px 24px',
          borderRadius: '14px',
          background: purchasing ? '#B0B8C1' : 'linear-gradient(135deg, #3182F6 0%, #1D6FE8 100%)',
          color: '#fff',
          border: '2px solid rgba(255,255,255,0.2)',
          cursor: purchasing ? 'not-allowed' : 'pointer',
          boxShadow: purchasing ? 'none' : '0 4px 16px rgba(49,130,246,0.4)',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '4px' }}>
          {purchasing ? '결제 중...' : '3회 질문 패키지 · 4,400원'}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.85, fontWeight: 500 }}>
          1회 질문보다 40% 저렴 · 1회당 1,633원
        </div>
      </button>
    </div>
  );
}

function Divider() {
  return (
    <div style={{ position: 'relative', textAlign: 'center', margin: '4px 0' }}>
      <span className="text-caption" style={{ background: 'var(--bg-card)', padding: '0 12px', position: 'relative', zIndex: 1 }}>
        또는
      </span>
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--color-divider)' }} />
    </div>
  );
}
