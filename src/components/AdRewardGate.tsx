import { useState, useEffect } from 'react';
import { useRewardedAd } from '../hooks/useAds';

// 광고 로드 최대 대기 시간 — 이후 폴백 허용
const AD_WAIT_MS = 5000;

interface Props {
  onRewarded: () => void;
  onSkip?: () => void;
  buttonText?: string;
  description?: string;
}

export function AdRewardGate({
  onRewarded,
  onSkip,
  buttonText = '광고 보고 결과 확인',
  description,
}: Props) {
  const { isLoaded, isShowing, show } = useRewardedAd();
  const [watching, setWatching] = useState(false);
  const [waitDone, setWaitDone] = useState(false);

  // 마운트 후 AD_WAIT_MS 동안 광고 로드 대기, 이후 폴백 허용
  useEffect(() => {
    if (isLoaded) return;
    const timer = setTimeout(() => setWaitDone(true), AD_WAIT_MS);
    return () => clearTimeout(timer);
  }, [isLoaded]);

  // 광고 로드 완료 시 타이머 무효화
  useEffect(() => {
    if (isLoaded) setWaitDone(false);
  }, [isLoaded]);

  const canClick = isLoaded || waitDone;

  const handleWatch = async () => {
    setWatching(true);
    try {
      if (isLoaded) {
        await show();
      }
    } catch {
      // failedToShow — 폴백
    } finally {
      setWatching(false);
    }
    onRewarded();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', width: '100%' }}>
      {description && (
        <p className="text-caption" style={{ textAlign: 'center' }}>
          {description}
        </p>
      )}
      <button
        className="btn-primary"
        onClick={handleWatch}
        disabled={!canClick || watching || isShowing}
        style={!canClick ? { opacity: 0.6 } : undefined}
      >
        {watching || isShowing
          ? '광고 시청 중...'
          : !canClick
          ? '광고 준비 중...'
          : buttonText}
      </button>
      {onSkip && (
        <button
          onClick={onSkip}
          style={{ color: 'var(--color-text-secondary)', fontSize: '13px', padding: '8px' }}
        >
          건너뛰기
        </button>
      )}
    </div>
  );
}
