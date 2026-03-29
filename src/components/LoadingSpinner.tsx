import { useState, useEffect } from 'react';

const MESSAGES = [
  '분석하고 있어요...',
  '운세를 읽고 있어요...',
  '결과를 준비하고 있어요...',
];

export function LoadingSpinner({ message }: { message?: string }) {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    if (message) return;
    const timer = setInterval(() => {
      setMsgIdx(prev => (prev + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [message]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      gap: '20px',
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        border: '3px solid #E5E8EB',
        borderTopColor: 'var(--color-primary)',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{
        color: 'var(--color-text-secondary)',
        fontSize: '14px',
        textAlign: 'center',
      }}>
        {message || MESSAGES[msgIdx]}
      </p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
