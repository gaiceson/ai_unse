import { useState, useCallback, useEffect, useRef } from 'react';
import { getCompatibilityBasic, getCompatibilityDetail, type CompatBasicResult, type CompatDetailResult } from '../services/compatibility';
import { PageHeader } from '../components/PageHeader';
import { ScoreCircle } from '../components/ScoreCircle';
import { PaymentButton } from '../components/PaymentButton';
import { ShareCard } from '../components/ShareCard';
import { useBirthday, useFortuneHistory } from '../hooks/useStorage';
import { BannerAd } from '../components/BannerAd';

interface PersonInput {
  name: string;
  year: string;
  month: string;
  day: string;
}

const initialPerson: PersonInput = { name: '', year: '', month: '', day: '' };

function PersonCard({ person, setPerson, icon, roleLabel }: {
  person: PersonInput;
  setPerson: (p: PersonInput) => void;
  icon: string;
  roleLabel: string;
}) {
  const hasBirthday = person.year.length === 4 && person.month && person.day;
  const [editing, setEditing] = useState(!hasBirthday);

  const handleDone = useCallback(() => {
    if (person.year.length === 4 && person.month && person.day) {
      setEditing(false);
    }
  }, [person]);

  if (!editing && hasBirthday) {
    return (
      <div className="card" style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'var(--color-primary-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', flexShrink: 0,
          }}>{icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{roleLabel}</span>
            </div>
            <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
              {person.name || roleLabel}
            </p>
            <p className="text-caption" style={{ marginTop: '2px' }}>
              {person.year}.{person.month.padStart(2, '0')}.{person.day.padStart(2, '0')}
            </p>
          </div>
          <button
            onClick={() => setEditing(true)}
            style={{
              fontSize: '13px', color: 'var(--color-primary)', fontWeight: 600,
              background: 'var(--color-primary-light)', border: 'none',
              borderRadius: '8px', padding: '6px 12px', cursor: 'pointer',
            }}
          >
            수정
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <h3 style={{ fontSize: '15px', fontWeight: 700 }}>{roleLabel}</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="text"
          placeholder="이름 (선택)"
          value={person.name}
          onChange={e => setPerson({ ...person, name: e.target.value })}
          className="input-field"
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="number"
            placeholder="년 (예: 1995)"
            value={person.year}
            onChange={e => setPerson({ ...person, year: e.target.value })}
            className="input-field"
            style={{ flex: 2, textAlign: 'center' }}
          />
          <input
            type="number"
            placeholder="월"
            value={person.month}
            onChange={e => setPerson({ ...person, month: e.target.value })}
            className="input-field"
            style={{ flex: 1, textAlign: 'center' }}
          />
          <input
            type="number"
            placeholder="일"
            value={person.day}
            onChange={e => setPerson({ ...person, day: e.target.value })}
            className="input-field"
            style={{ flex: 1, textAlign: 'center' }}
          />
        </div>
        {hasBirthday && (
          <button
            onClick={handleDone}
            style={{
              fontSize: '14px', color: 'var(--color-primary)', fontWeight: 600,
              background: 'none', border: 'none', cursor: 'pointer',
              textAlign: 'right', padding: '4px 0',
            }}
          >
            완료
          </button>
        )}
      </div>
    </div>
  );
}

const LOCKED_ITEMS = [
  { icon: '💥', label: '싸울 때 패턴' },
  { icon: '💍', label: '결혼 궁합' },
  { icon: '💰', label: '재물 궁합' },
  { icon: '⏳', label: '오래 가는 관계인지' },
  { icon: '💔', label: '헤어질 가능성' },
  { icon: '🔮', label: '이 관계의 미래' },
];

export function CompatPage() {
  const { birthday } = useBirthday();
  const [person1, setPerson1] = useState<PersonInput>(() => {
    if (birthday) {
      return {
        name: '',
        year: String(birthday.year),
        month: String(birthday.month),
        day: String(birthday.day),
      };
    }
    return initialPerson;
  });
  const [person2, setPerson2] = useState<PersonInput>(initialPerson);
  const [step, setStep] = useState<'input' | 'loading' | 'preview' | 'detailLoading' | 'detail'>('input');
  const [basic, setBasic] = useState<CompatBasicResult | null>(null);
  const [detail, setDetail] = useState<CompatDetailResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { addHistory } = useFortuneHistory();

  const isValid = (p: PersonInput) =>
    p.year.length === 4 && Number(p.month) >= 1 && Number(p.month) <= 12 && Number(p.day) >= 1 && Number(p.day) <= 31;

  const bothValid = isValid(person1) && isValid(person2);

  const p1Data = { year: Number(person1.year), month: Number(person1.month), day: Number(person1.day), name: person1.name || undefined };
  const p2Data = { year: Number(person2.year), month: Number(person2.month), day: Number(person2.day), name: person2.name || undefined };

  const fetchBasic = async () => {
    setStep('loading');
    setError(null);
    try {
      const r = await getCompatibilityBasic(p1Data, p2Data);
      setBasic(r);
      addHistory({ type: '궁합 분석', summary: `${r.overallScore}점 - ${r.chemistryType}` });
      setStep('preview');
    } catch {
      setError('궁합 분석에 실패했어요.');
      setStep('input');
    }
  };

  const fetchDetail = async () => {
    setStep('detailLoading');
    setError(null);
    try {
      const r = await getCompatibilityDetail(p1Data, p2Data);
      setDetail(r);
      setStep('detail');
    } catch {
      setError('상세 분석에 실패했어요.');
      setStep('preview');
    }
  };

  const handleRetry = () => {
    setPerson1(initialPerson);
    setPerson2(initialPerson);
    setBasic(null);
    setDetail(null);
    setError(null);
    setStep('input');
  };

  // Input
  if (step === 'input') {
    return (
      <div className="page">
        <PageHeader title="궁합 분석" />
        <p className="text-caption" style={{ marginBottom: '20px' }}>
          두 사람의 생년월일로 궁합을 분석해드려요
        </p>
        <PersonCard person={person1} setPerson={setPerson1} icon="👤" roleLabel="나" />
        <PersonCard person={person2} setPerson={setPerson2} icon="👤" roleLabel="상대" />
        {error && <p style={{ color: 'var(--color-danger)', textAlign: 'center', marginBottom: '12px' }}>{error}</p>}
        <button className="btn-primary" disabled={!bothValid} onClick={fetchBasic}>
          궁합 분석하기
        </button>
      </div>
    );
  }

  // Loading
  if (step === 'loading') {
    return <CompatLoadingScreen person1={person1} person2={person2} mode="basic" />;
  }

  // Preview (무료)
  if (step === 'preview' && basic) {
    return (
      <div className="page">
        <PageHeader title="궁합 분석" />

        {/* Score */}
        <div className="card" style={{ textAlign: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'var(--color-primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 6px', fontSize: '18px',
              }}>👤</div>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{person1.name || '나'}</span>
            </div>
            <ScoreCircle score={basic.overallScore} size={110} label="궁합 점수" />
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'var(--color-primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 6px', fontSize: '18px',
              }}>👤</div>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{person2.name || '상대'}</span>
            </div>
          </div>

          {/* Relationship Type */}
          <div style={{ marginBottom: '12px' }}>
            <p className="text-caption" style={{ marginBottom: '4px' }}>관계 타입</p>
            <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>{basic.relationshipType}</p>
          </div>

          {/* Chemistry Type */}
          <div style={{
            background: 'var(--color-primary-light)',
            borderRadius: '20px',
            padding: '8px 16px',
            display: 'inline-block',
            marginBottom: '12px',
          }}>
            <span style={{ color: 'var(--color-primary)', fontSize: '15px', fontWeight: 700 }}>
              {basic.chemistryType}
            </span>
          </div>

          {/* Keywords */}
          <div>
            <p className="text-caption" style={{ marginBottom: '8px' }}>핵심 키워드</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {basic.keywords.map((kw) => (
                <span key={kw} style={{
                  padding: '6px 14px',
                  borderRadius: '16px',
                  border: '1px solid var(--color-divider)',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                }}>
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Love Chance */}
        <div className="card" style={{ marginBottom: '12px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#e05297' }}>💘 연애 가능성</h3>
            <span style={{ fontSize: '16px' }}>🔒</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
            <div style={{
              fontSize: '28px', fontWeight: 800, color: '#e05297',
              background: 'linear-gradient(135deg, #fce4ec, #f8bbd0)',
              borderRadius: '12px', padding: '8px 16px',
            }}>
              {basic.loveChance}%
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>
              {basic.loveChance >= 80 ? '연인 될 확률 매우 높음' : basic.loveChance >= 60 ? '연인 될 가능성 있음' : '천천히 다가가야 할 관계'}
            </span>
          </div>
          <p className="text-body" style={{
            lineHeight: 1.8,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
          }}>{basic.loveChancePreview}</p>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px',
            background: 'linear-gradient(transparent, var(--bg-card, #fff))',
          }} />
        </div>

        {/* Strengths Preview with lock */}
        <div className="card" style={{ marginBottom: '12px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-success)' }}>💚 관계 장단점</h3>
            <span style={{ fontSize: '16px' }}>🔒</span>
          </div>
          <p className="text-body" style={{
            lineHeight: 1.8,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
          }}>{basic.strengthsPreview}</p>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px',
            background: 'linear-gradient(transparent, var(--bg-card, #fff))',
          }} />
        </div>

        {/* Locked Items */}
        <div className="card" style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {LOCKED_ITEMS.map((item) => (
              <div key={item.label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'var(--bg-secondary, #f5f5f5)',
                opacity: 0.7,
              }}>
                <span style={{ fontSize: '20px' }}>{item.icon}</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', flex: 1 }}>{item.label}</span>
                <span style={{ fontSize: '16px' }}>🔒</span>
              </div>
            ))}
          </div>
        </div>

        {/* Purchase CTA */}
        <div className="card" style={{ textAlign: 'center', padding: '28px 20px', marginBottom: '12px' }}>
          <p style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text)' }}>
            두 사람의 궁합을 더 깊이 알아보세요
          </p>
          <p className="text-caption" style={{ marginBottom: '20px' }}>
            관계 장단점, 싸울 때 패턴, 결혼 궁합까지
          </p>
          <PaymentButton
            sku="ait.0000021209.c1de367a.173e5848dd.3279699307"
            label="궁합 풀어보기 · 2,200원"
            onSuccess={() => fetchDetail()}
          />
        </div>

        {/* Share */}
        <ShareCard
          title="궁합 분석"
          score={basic.overallScore}
          message={`💑 ${basic.chemistryType} · ${basic.relationshipType}\n\n${basic.strengthsPreview}`}
          type="궁합 분석"
        />

        <button className="btn-secondary" onClick={handleRetry} style={{ marginTop: '12px' }}>
          다른 궁합 보기
        </button>

        <BannerAd />
      </div>
    );
  }

  // Detail Loading
  if (step === 'detailLoading') {
    return <CompatLoadingScreen person1={person1} person2={person2} mode="detail" />;
  }

  // Detail Result (유료)
  if (step === 'detail' && basic && detail) {
    return (
      <div className="page">
        <PageHeader title="궁합 분석" />

        {/* Score */}
        <div className="card" style={{ textAlign: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'var(--color-primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 6px', fontSize: '18px',
              }}>👤</div>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{person1.name || '나'}</span>
            </div>
            <ScoreCircle score={basic.overallScore} size={110} />
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'var(--color-primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 6px', fontSize: '18px',
              }}>👤</div>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{person2.name || '상대'}</span>
            </div>
          </div>
          <div style={{
            background: 'var(--color-primary-light)',
            borderRadius: '20px',
            padding: '8px 16px',
            display: 'inline-block',
          }}>
            <span style={{ color: 'var(--color-primary)', fontSize: '15px', fontWeight: 700 }}>
              {basic.chemistryType} · {basic.relationshipType}
            </span>
          </div>
        </div>

        {/* Love Chance Detail */}
        <div className="card" style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#e05297' }}>💘 연애 가능성</h3>
            <span style={{
              fontSize: '14px', fontWeight: 800, color: '#e05297',
              background: 'linear-gradient(135deg, #fce4ec, #f8bbd0)',
              borderRadius: '8px', padding: '2px 10px',
            }}>{basic.loveChance}%</span>
          </div>
          <p className="text-body" style={{ lineHeight: 1.8 }}>{detail.loveChanceDetail}</p>
        </div>

        {/* Strengths */}
        <div className="card" style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: 'var(--color-success)' }}>💚 관계 장단점</h3>
          <p className="text-body" style={{ lineHeight: 1.8 }}>{detail.strengths}</p>
          <div style={{ borderTop: '1px solid var(--color-divider)', marginTop: '12px', paddingTop: '12px' }}>
            <p className="text-body" style={{ lineHeight: 1.8, color: 'var(--color-warning)' }}>{detail.cautions}</p>
          </div>
        </div>

        {/* Fight Pattern */}
        <div className="card" style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>💥 싸울 때 패턴</h3>
          <p className="text-body" style={{ lineHeight: 1.8 }}>{detail.fightPattern}</p>
        </div>

        {/* Marriage */}
        <div className="card" style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>💍 결혼 궁합</h3>
          <p className="text-body" style={{ lineHeight: 1.8 }}>{detail.marriageCompat}</p>
        </div>

        {/* Money */}
        <div className="card" style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>💰 재물 궁합</h3>
          <p className="text-body" style={{ lineHeight: 1.8 }}>{detail.moneyCompat}</p>
        </div>

        {/* Longevity */}
        <div className="card" style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>⏳ 오래 가는 관계인지</h3>
          <p className="text-body" style={{ lineHeight: 1.8 }}>{detail.longevity}</p>
        </div>

        {/* Breakup Risk */}
        <div className="card" style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>💔 헤어질 가능성</h3>
          <p className="text-body" style={{ lineHeight: 1.8 }}>{detail.breakupRisk}</p>
        </div>

        {/* Future Outlook */}
        <div className="card" style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>🔮 이 관계의 미래</h3>
          <p className="text-body" style={{ lineHeight: 1.8 }}>{detail.futureOutlook}</p>
        </div>

        {/* Advice */}
        <div className="card" style={{
          marginBottom: '20px',
          background: 'var(--color-primary-light)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-primary)' }}>
            {detail.advice}
          </p>
        </div>

        {/* Share & Actions */}
        <ShareCard
          title="궁합 분석"
          score={basic.overallScore}
          message={[
            `💑 ${basic.chemistryType} · ${basic.relationshipType}`,
            `💘 연애 가능성 ${basic.loveChance}%:\n${detail.loveChanceDetail}`,
            `💚 관계 장단점:\n${detail.strengths}\n${detail.cautions}`,
            `💥 싸울 때 패턴:\n${detail.fightPattern}`,
            `💍 결혼 궁합:\n${detail.marriageCompat}`,
            `💰 재물 궁합:\n${detail.moneyCompat}`,
            `⏳ 오래 가는 관계인지:\n${detail.longevity}`,
            `💔 헤어질 가능성:\n${detail.breakupRisk}`,
            `🔮 이 관계의 미래:\n${detail.futureOutlook}`,
            `💡 조언: ${detail.advice}`,
          ].join('\n\n')}
          type="궁합 분석"
        />

        <button className="btn-secondary" onClick={handleRetry} style={{ marginTop: '12px' }}>
          다른 궁합 보기
        </button>

        <BannerAd />
      </div>
    );
  }

  return null;
}

const BASIC_STEPS = [
  { icon: '🔍', title: '두 사람 기운 파악 중...', sub: '생년월일로 각자의 사주 기운을 읽고 있어요' },
  { icon: '☯️', title: '오행 상생상극 대조 중...', sub: '두 사람의 오행이 어떻게 맞닿는지 살펴봐요' },
  { icon: '💘', title: '궁합 점수 계산 중...', sub: '설레는 점수가 나올지... 두근두근' },
  { icon: '✨', title: '결과 마무리 중...', sub: '거의 다 됐어요. 조금만 기다려 주세요' },
];

const DETAIL_STEPS = [
  { icon: '🔮', title: '관계 심층 분석 중...', sub: '두 사람 사이의 깊은 흐름을 파악하고 있어요' },
  { icon: '💥', title: '갈등 패턴 파악 중...', sub: '싸울 때 어떤 패턴이 나오는지 살펴봐요' },
  { icon: '💍', title: '미래 흐름 계산 중...', sub: '결혼 궁합과 장기 관계를 점쳐보는 중이에요' },
  { icon: '📋', title: '상세 리포트 작성 중...', sub: '모든 분석을 정리하고 있어요' },
];

const COMPAT_TIPS = [
  '사주에서 궁합은 두 사람의 오행이 서로 돕는지(상생), 충돌하는지(상극)를 봐요',
  '점수가 낮아도 괜찮아요. 서로의 차이를 알고 이해하는 게 진짜 궁합이에요',
  '궁합이 좋다고 무조건 행복하진 않아요. 결국 두 사람이 어떻게 맞춰가느냐가 핵심이에요',
  '사주에서 일주(태어난 날의 기운)가 비슷하면 서로 잘 이해하는 편이에요',
  '상극이어도 오히려 서로를 자극하며 성장하는 관계가 되기도 해요',
];

function CompatLoadingScreen({
  person1, person2, mode,
}: {
  person1: PersonInput;
  person2: PersonInput;
  mode: 'basic' | 'detail';
}) {
  const steps = mode === 'basic' ? BASIC_STEPS : DETAIL_STEPS;
  const [stepIdx, setStepIdx] = useState(0);
  const [tipIdx] = useState(() => Math.floor(Math.random() * COMPAT_TIPS.length));
  const [dotCount, setDotCount] = useState(1);
  const [heartBeat, setHeartBeat] = useState(false);
  const stepRef = useRef(0);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      stepRef.current = Math.min(stepRef.current + 1, steps.length - 1);
      setStepIdx(stepRef.current);
    }, 2800);
    const dotTimer = setInterval(() => {
      setDotCount(d => (d % 3) + 1);
    }, 500);
    const heartTimer = setInterval(() => {
      setHeartBeat(v => !v);
    }, 900);
    return () => {
      clearInterval(stepTimer);
      clearInterval(dotTimer);
      clearInterval(heartTimer);
    };
  }, [steps.length]);

  const step = steps[stepIdx];
  const dots = '.'.repeat(dotCount);
  const name1 = person1.name || '나';
  const name2 = person2.name || '상대';

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh' }}>
      <h1 className="page-title">궁합 분석</h1>

      {/* Two person avatars */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0',
        marginBottom: '32px',
      }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'var(--color-primary-light)',
            border: '2px solid var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', margin: '0 auto 6px',
          }}>👤</div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>{name1}</p>
          <p className="text-caption" style={{ fontSize: '11px' }}>
            {person1.year}.{person1.month.padStart(2,'0')}.{person1.day.padStart(2,'0')}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 8px' }}>
          <span style={{
            fontSize: '32px',
            transform: heartBeat ? 'scale(1.3)' : 'scale(1)',
            transition: 'transform 0.3s ease',
            display: 'block',
          }}>💗</span>
        </div>

        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: '#fce4ec',
            border: '2px solid #e05297',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', margin: '0 auto 6px',
          }}>👤</div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>{name2}</p>
          <p className="text-caption" style={{ fontSize: '11px' }}>
            {person2.year}.{person2.month.padStart(2,'0')}.{person2.day.padStart(2,'0')}
          </p>
        </div>
      </div>

      {/* Main loading area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <div style={{
          fontSize: '64px',
          animation: 'compatPulse 1.5s ease-in-out infinite',
          lineHeight: 1,
        }}>
          {step.icon}
        </div>

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
          {steps.map((_, i) => (
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

      {/* Tip */}
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
          {COMPAT_TIPS[tipIdx]}
        </p>
      </div>

      <style>{`
        @keyframes compatPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.12); opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}
