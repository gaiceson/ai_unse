import { useEffect, useRef } from 'react';
import { useTossBanner, AD_IDS } from '../hooks/useAds';

interface Props {
  adGroupId?: string;
  theme?: 'auto' | 'light' | 'dark';
}

export function BannerAd({ adGroupId = AD_IDS.banner, theme = 'light' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isInitialized, attachBanner } = useTossBanner();

  useEffect(() => {
    if (!isInitialized || !containerRef.current) return;

    const attached = attachBanner(adGroupId, containerRef.current, {
      theme,
      tone: 'blackAndWhite',
      variant: 'expanded',
      callbacks: {
        onAdRendered: () => console.log('배너 광고 렌더링 완료'),
        onAdImpression: () => console.log('배너 광고 노출 기록'),
        onAdFailedToRender: (payload) => {
          console.error('배너 광고 렌더링 실패:', payload.error.message);
        },
        onNoFill: () => console.warn('표시할 배너 광고 없음'),
      },
    });

    return () => {
      attached?.destroy();
    };
  }, [isInitialized, adGroupId, theme, attachBanner]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '96px',
        marginTop: '16px',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    />
  );
}
