import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeTossCode } from '../services/toss-auth';
import { useBirthday } from '../hooks/useStorage';

type Status = 'loading' | 'error';

export function TossCallbackPage() {
  const navigate = useNavigate();
  const { setBirthday } = useBirthday();
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code) {
      setErrorMsg('인가 코드가 없어요. 다시 로그인해주세요.');
      setStatus('error');
      return;
    }

    exchangeTossCode(code)
      .then(({ birthday }) => {
        setBirthday(birthday);
        navigate('/home', { replace: true });
      })
      .catch((err: Error) => {
        setErrorMsg(err.message || '로그인 처리 중 오류가 발생했어요.');
        setStatus('error');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        padding: '24px',
      }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '50%',
          border: '3px solid #E5E8EB',
          borderTopColor: 'var(--color-primary)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)' }}>
          토스 로그인 처리 중...
        </p>
        <p className="text-caption">생년월일 정보를 가져오고 있어요</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      padding: '24px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '52px' }}>😢</div>
      <h2 style={{ fontSize: '18px', fontWeight: 700 }}>로그인에 실패했어요</h2>
      <p className="text-caption">{errorMsg}</p>
      <button className="btn-primary" style={{ marginTop: '8px' }} onClick={() => navigate('/')}>
        홈으로 돌아가기
      </button>
    </div>
  );
}
