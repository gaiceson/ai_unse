import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBirthday } from '../hooks/useStorage';
import { exchangeTossCode } from '../services/toss-auth';

async function handleClose() {
  try {
    const { closeView } = await import('@apps-in-toss/web-bridge');
    await closeView();
  } catch {
    window.close();
  }
}

const isWebMode = import.meta.env.MODE === 'web';

const SERVICES = [
  { icon: '🔮', title: '오늘의 운세', desc: '매일 새롭게 분석되는 나만의 운세' },
  { icon: '📜', title: '사주 분석', desc: '생년월일로 보는 사주팔자 심층 분석' },
  { icon: '🃏', title: '타로 리딩', desc: '카드로 보는 현재와 미래' },
  { icon: '💕', title: '궁합 분석', desc: '두 사람의 케미와 궁합 점수' },
  { icon: '💬', title: 'AI 운세 상담', desc: '이직·연애·투자 등 무엇이든 질문' },
];

export function IntroPage() {
  const navigate = useNavigate();
  const { hasBirthday, birthday, setBirthday, clearBirthday } = useBirthday();
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (!hasBirthday) return;

    if (isWebMode || birthday?.loginSource !== 'toss') {
      navigate('/home', { replace: true });
      return;
    }

    // 토스 로그인 연결 상태 검증
    import('@apps-in-toss/web-bridge').then(({ getIsTossLoginIntegratedService }) => {
      getIsTossLoginIntegratedService().then(isConnected => {
        if (isConnected === false) {
          // 연결 끊김 → 로컬 데이터 초기화 후 약관 화면 노출
          clearBirthday();
        } else {
          navigate('/home', { replace: true });
        }
      }).catch(() => navigate('/home', { replace: true }));
    }).catch(() => navigate('/home', { replace: true }));
  }, [hasBirthday, birthday?.loginSource, navigate, clearBirthday]);

  async function handleAppLogin() {
    setLoggingIn(true);
    setLoginError('');
    try {
      const { appLogin } = await import('@apps-in-toss/web-framework');
      const { authorizationCode, referrer } = await appLogin();
      const { birthday } = await exchangeTossCode(authorizationCode, referrer);
      setBirthday({ ...birthday, loginSource: 'toss' });
      navigate('/home', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setLoginError(msg || '로그인에 실패했어요. 다시 시도해주세요.');
      setLoggingIn(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>

      {/* 닫기 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px 0' }}>
        <button
          onClick={handleClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-secondary)', fontSize: '14px', fontWeight: 600 }}
        >
          닫기
        </button>
      </div>

      {/* 히어로 */}
      <div style={{ textAlign: 'center', padding: '24px 20px 28px' }}>
        <img
          src="https://iagjuubpbrafwiuoqgrr.supabase.co/storage/v1/object/public/assets/logo.png"
          alt="운세연구소"
          style={{ width: 76, height: 76, borderRadius: '20px', marginBottom: '16px', boxShadow: '0 4px 16px rgba(49,130,246,0.2)' }}
        />
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-text)', marginBottom: '8px' }}>
          운세연구소
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          AI가 생년월일로 분석하는<br />오늘의 운세 · 사주 · 타로 · 궁합
        </p>
      </div>

      {/* 서비스 목록 */}
      <div style={{ padding: '0 20px', flex: 1 }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          {SERVICES.map((svc, i) => (
            <div
              key={svc.title}
              style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 18px',
                borderBottom: i < SERVICES.length - 1 ? '1px solid var(--color-divider)' : 'none',
              }}
            >
              <span style={{ fontSize: '22px', flexShrink: 0 }}>{svc.icon}</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>{svc.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{svc.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 로그인 버튼 영역 */}
      <div style={{ padding: '0 20px 20px', marginTop: 'auto' }}>
        {!isWebMode ? (
          <>
            <button
              onClick={handleAppLogin}
              disabled={loggingIn}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                width: '100%', padding: '16px',
                borderRadius: '14px',
                background: loggingIn ? '#B0B8C1' : '#0064FF',
                color: '#fff', border: 'none',
                fontSize: '16px', fontWeight: 700,
                cursor: loggingIn ? 'default' : 'pointer',
                boxShadow: loggingIn ? 'none' : '0 4px 14px rgba(0,100,255,0.35)',
              }}
            >
              <img
                src="https://static.toss.im/icons/png/4x/icon-toss-logo-line.png"
                alt="toss"
                style={{ width: '22px', height: '22px', borderRadius: '4px' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              {loggingIn ? '로그인 중...' : '토스로 시작하기'}
            </button>
            {loginError && (
              <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-danger)', marginTop: '8px' }}>
                {loginError}
              </p>
            )}
            <button
              onClick={() => navigate('/home')}
              style={{
                width: '100%', background: 'none', border: 'none',
                color: 'var(--color-text-secondary)', fontSize: '13px',
                cursor: 'pointer', padding: '12px 4px 4px',
              }}
            >
              생년월일 직접 입력하기
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate('/home')}
            style={{
              width: '100%', padding: '16px', borderRadius: '14px',
              background: '#0064FF', color: '#fff', border: 'none',
              fontSize: '16px', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,100,255,0.35)',
            }}
          >
            시작하기
          </button>
        )}

        <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '12px', lineHeight: 1.6 }}>
          시작 시{' '}
          <a href="https://www.notion.so/31d469a42a068015bab8e281aa818e6e" target="_blank" rel="noreferrer" style={{ color: 'var(--color-text-secondary)', textDecoration: 'underline' }}>
            서비스 이용약관
          </a>
          {' '}및{' '}
          <a href="https://www.notion.so/31d469a42a068015bab8e281aa818e6e" target="_blank" rel="noreferrer" style={{ color: 'var(--color-text-secondary)', textDecoration: 'underline' }}>
            개인정보 처리방침
          </a>
          에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}
