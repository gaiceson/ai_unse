import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBirthday, useCachedResult } from '../hooks/useStorage';
import { getTossAuthUrl } from '../services/toss-auth';
import { getFortune, type FortuneResult } from '../services/fortune';
import { ScoreCircle } from '../components/ScoreCircle';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { PageHeader } from '../components/PageHeader';

const MENU_ITEMS = [
  { path: '/fortune', icon: '🔮', title: '오늘의 운세', desc: '매일 바뀌는 나의 운세' },
  { path: '/consult', icon: '🤖', title: 'AI 운세 상담', desc: '무엇이든 물어보세요' },
  { path: '/tarot', icon: '🃏', title: '타로 리딩', desc: '타로 카드 리딩' },
  { path: '/saju', icon: '📜', title: '사주 분석', desc: '사주팔자 심층 분석' },
  { path: '/compat', icon: '💕', title: '궁합 분석', desc: '두 사람의 케미 분석' },
];

export function HomePage() {
  const navigate = useNavigate();
  const { birthday } = useBirthday();
  const { getCached, setCache } = useCachedResult('fortune');
  const [fortune, setFortune] = useState<FortuneResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!birthday) return;
    const cached = getCached();
    if (cached) {
      setFortune(JSON.parse(cached));
      return;
    }
    setLoading(true);
    getFortune(birthday.year, birthday.month, birthday.day)
      .then(result => {
        setFortune(result);
        setCache(JSON.stringify(result));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [birthday, getCached, setCache]);

  return (
    <div className="page">
      {/* Header */}
      <PageHeader
        title="운세연구소"
        right={
          <button
            onClick={() => navigate('/my')}
            style={{
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              lineHeight: 1,
              borderRadius: '50%',
              background: 'var(--bg-card)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </button>
        }
      />
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
        당신만을 위한 운세 분석
      </p>

      {/* Today's fortune summary */}
      {birthday && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700 }}>오늘의 운세</h2>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
              {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
            </span>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : fortune ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <ScoreCircle score={fortune.overall.score} size={110} label="종합 운세" />
              </div>
              <p style={{
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
                fontSize: '14px',
                lineHeight: 1.6,
                marginBottom: '16px',
              }}>
                {fortune.overall.message}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <ScoreCircle score={fortune.love.score} size={52} label="연애" delay={200} />
                <ScoreCircle score={fortune.money.score} size={52} label="재물" delay={400} />
                <ScoreCircle score={fortune.health.score} size={52} label="건강" delay={600} />
                <ScoreCircle score={fortune.luck.score} size={52} label="행운" delay={800} />
              </div>
              <button
                onClick={() => navigate('/fortune')}
                className="btn-secondary"
                style={{ marginTop: '16px' }}
              >
                상세 운세 보기
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                운세를 불러오지 못했어요
              </p>
              <button
                className="btn-primary"
                style={{ marginTop: '12px', width: 'auto', padding: '12px 24px' }}
                onClick={() => navigate('/fortune')}
              >
                다시 시도
              </button>
            </div>
          )}
        </div>
      )}

      {/* No birthday yet */}
      {!birthday && (
        <div className="card" style={{ marginBottom: '20px', textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✨</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
            나만의 운세를 확인해보세요
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
            토스 로그인으로 생년월일을 가져오거나 직접 입력할 수 있어요
          </p>
          {/* 토스로 로그인 */}
          <button
            onClick={() => { window.location.href = getTossAuthUrl(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '100%',
              padding: '16px',
              borderRadius: '14px',
              background: '#0064FF',
              color: '#fff',
              border: 'none',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: '12px',
              boxShadow: '0 4px 14px rgba(0,100,255,0.35)',
            }}
          >
            <img
              src="https://static.toss.im/icons/png/4x/icon-toss-logo-line.png"
              alt="toss"
              style={{ width: '22px', height: '22px', borderRadius: '4px' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            토스로 로그인
          </button>
          {/* 직접 입력 */}
          <button
            onClick={() => navigate('/fortune')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-secondary)',
              fontSize: '14px',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: '4px',
            }}
          >
            생년월일 직접 입력하기
          </button>
        </div>
      )}

      {/* AI 운세 상담 */}
      <button
        onClick={() => navigate('/consult')}
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '20px',
          marginBottom: '12px',
          cursor: 'pointer',
          background: 'linear-gradient(135deg, var(--color-primary-light) 0%, var(--bg-card) 100%)',
          border: '1.5px solid var(--color-primary)',
          transition: 'box-shadow 0.2s',
        }}
      >
        <span style={{ fontSize: '36px', flexShrink: 0 }}>🤖</span>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-primary)' }}>AI 운세 상담</div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            이직, 연애, 투자... 무엇이든 물어보세요
          </div>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '18px', color: 'var(--color-primary)' }}>›</span>
      </button>

      {/* Menu Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
      }}>
        {MENU_ITEMS.filter(item => item.path !== '/consult').map((item) => {
          const isEmphasized = item.path === '/saju' || item.path === '/compat';
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                padding: '24px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s',
                ...(isEmphasized && {
                  background: 'linear-gradient(145deg, #f0f0ff 0%, #e8eaff 100%)',
                  border: '1.5px solid #c7caff',
                  boxShadow: '0 2px 12px rgba(99,102,241,0.12)',
                }),
              }}
            >
              <span style={{ fontSize: '32px' }}>{item.icon}</span>
              <span style={{
                fontSize: '15px',
                fontWeight: 800,
                color: isEmphasized ? '#3730a3' : 'var(--color-text)',
              }}>
                {item.title}
              </span>
              <span style={{
                fontSize: '12px',
                color: isEmphasized ? '#6366f1' : 'var(--color-text-secondary)',
              }}>
                {item.desc}
              </span>
              {isEmphasized && (
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#6366f1',
                  letterSpacing: '0.5px',
                }}>
                  ✦ PREMIUM
                </span>
              )}
            </button>
          );
        })}
      </div>


    </div>
  );
}
