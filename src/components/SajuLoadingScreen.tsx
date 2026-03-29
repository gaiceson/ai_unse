import { useState, useEffect, useRef } from 'react';

const HEADER_MESSAGES = [
  { icon: '🔯', text: '태어난 날의 기운을 읽는 중이에요' },
  { icon: '🌙', text: '오행 흐름을 파악하는 중이에요' },
  { icon: '⭐', text: '당신의 인생 패턴 찾는 중이에요' },
  { icon: '✨', text: '솔직한 팩폭 준비 중이에요' },
  { icon: '💫', text: '거의 다 됐어요. 각오 되셨나요?' },
];

const SAJU_TIPS = [
  '일주(日柱)는 나를 나타내요. 태어난 날의 천간이 당신의 본성이에요.',
  '오행이 골고루 있는 사주가 꼭 좋은 건 아니에요. 한 기운이 강하면 그게 특기예요.',
  '사주는 변하지 않지만, 매년 다른 기운이 들어오면서 흐름이 달라져요.',
  '천간은 드러나는 성격, 지지는 내면의 성격이에요. 사람마다 두 얼굴이 있어요.',
  '같은 날 태어났어도 시간이 다르면 사주가 달라져요. 태어난 시각이 중요한 이유예요.',
];

const BASIC_STEPS = [
  { icon: '📅', label: '생년월일 기운 읽는 중' },
  { icon: '⚖️', label: '오행 밸런스 체크 중' },
  { icon: '🧬', label: '타고난 성격 파악 중' },
  { icon: '💰', label: '재물 흐름 확인 중' },
  { icon: '✨', label: '핵심 키워드 뽑는 중' },
];

const DETAILED_STEPS = [
  { icon: '📅', label: '사주팔자 기초 계산 중' },
  { icon: '⚖️', label: '오행 밸런스 분석 중' },
  { icon: '🧬', label: '타고난 성격 파악 중' },
  { icon: '🌊', label: '인생 전체 흐름 분석 중' },
  { icon: '💰', label: '재물 모이는 패턴 분석 중' },
  { icon: '💕', label: '연애 스타일 파악 중' },
  { icon: '💼', label: '직업운 방향 분석 중' },
  { icon: '💪', label: '건강 주의 부분 체크 중' },
  { icon: '📆', label: '올해 운세 계산 중' },
  { icon: '🔮', label: '팩폭 메시지 마무리 중' },
];

export function SajuLoadingScreen({ detailed = false, done = false }: { detailed?: boolean; done?: boolean }) {
  const steps = detailed ? DETAILED_STEPS : BASIC_STEPS;
  const [completedCount, setCompletedCount] = useState(0);
  const [headerIdx, setHeaderIdx] = useState(0);
  const [dotCount, setDotCount] = useState(1);
  const [tipIdx] = useState(() => Math.floor(Math.random() * SAJU_TIPS.length));
  const headerRef = useRef(0);

  const stallAt = steps.length - 2;

  // 단계 진행
  useEffect(() => {
    const waiting = !done && completedCount >= stallAt;
    const finished = completedCount >= steps.length;
    if (waiting || finished) return;
    const timer = setTimeout(
      () => setCompletedCount(prev => prev + 1),
      done ? 150 : 950,
    );
    return () => clearTimeout(timer);
  }, [completedCount, done, stallAt, steps.length]);

  // 헤더 메시지 순환 + 점 애니메이션
  useEffect(() => {
    const msgTimer = setInterval(() => {
      headerRef.current = (headerRef.current + 1) % HEADER_MESSAGES.length;
      setHeaderIdx(headerRef.current);
    }, 2600);
    const dotTimer = setInterval(() => {
      setDotCount(d => (d % 3) + 1);
    }, 500);
    return () => {
      clearInterval(msgTimer);
      clearInterval(dotTimer);
    };
  }, []);

  const progress = Math.round((completedCount / steps.length) * 100);
  const msg = HEADER_MESSAGES[headerIdx];
  const dots = '.'.repeat(dotCount);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 0', gap: '16px' }}>

      {/* 헤더: 아이콘 + 회전 메시지 */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '10px', padding: '20px 16px',
        background: 'var(--bg-card)', borderRadius: '16px',
        border: '1px solid var(--color-divider)',
      }}>
        <div style={{ fontSize: '52px', animation: 'saju-pulse 1.6s ease-in-out infinite', lineHeight: 1 }}>
          {msg.icon}
        </div>
        <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', textAlign: 'center', margin: 0 }}>
          {msg.text.replace(/이에요$/, `이에요${dots}`)}
        </p>
        {/* 전체 진행바 */}
        <div style={{ width: '100%', maxWidth: '240px' }}>
          <div style={{
            height: '6px', background: 'var(--color-divider)',
            borderRadius: '3px', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--color-primary), #7c3aed)',
              borderRadius: '3px',
              transition: 'width 0.6s ease',
            }} />
          </div>
          <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textAlign: 'right', marginTop: '4px' }}>
            {progress}%
          </p>
        </div>
      </div>

      {/* 단계 체크리스트 */}
      <div style={{
        background: 'var(--bg-card)', borderRadius: '14px',
        border: '1px solid var(--color-divider)',
        padding: '16px',
        display: 'flex', flexDirection: 'column', gap: '8px',
      }}>
        {steps.map((step, i) => {
          const isDone = i < completedCount;
          const isActive = i === completedCount;
          return (
            <div
              key={step.label}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                opacity: isDone || isActive ? 1 : 0.3,
                transition: 'opacity 0.4s ease',
              }}
            >
              {/* 상태 아이콘 */}
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isDone ? 'var(--color-primary)' : isActive ? 'var(--color-primary-light)' : 'var(--color-divider)',
                transition: 'background 0.3s ease',
                boxShadow: isActive ? '0 0 0 3px var(--color-primary-light)' : 'none',
              }}>
                {isDone ? (
                  <span style={{ color: '#fff', fontSize: '12px', fontWeight: 700 }}>✓</span>
                ) : isActive ? (
                  <div style={{
                    width: '9px', height: '9px', borderRadius: '50%',
                    background: 'var(--color-primary)',
                    animation: 'saju-dot 1s ease-in-out infinite',
                  }} />
                ) : (
                  <span style={{ fontSize: '13px', opacity: 0.5 }}>{step.icon}</span>
                )}
              </div>

              {/* 단계 텍스트 */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {(isDone || isActive) && (
                  <span style={{ fontSize: '14px' }}>{step.icon}</span>
                )}
                <span style={{
                  fontSize: '14px',
                  color: isDone ? 'var(--color-text)' : isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  fontWeight: isDone || isActive ? 600 : 400,
                  transition: 'color 0.3s ease',
                }}>
                  {isActive ? `${step.label}${dots}` : step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 사주 상식 팁 */}
      <div style={{
        padding: '14px 16px', borderRadius: '12px',
        background: 'var(--bg-card)', border: '1px solid var(--color-divider)',
      }}>
        <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '5px' }}>
          🔯 사주 상식
        </p>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
          {SAJU_TIPS[tipIdx]}
        </p>
      </div>

      <style>{`
        @keyframes saju-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.85; }
        }
        @keyframes saju-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
