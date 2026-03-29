import { useCallback, useEffect, useRef, useState } from 'react';
import {
  TossAds,
  loadFullScreenAd,
  showFullScreenAd,
} from '@apps-in-toss/web-framework';
import type { TossAdsAttachBannerOptions } from '@apps-in-toss/web-framework';

// 웹 환경에서 isSupported() 호출 시 throw 하므로 안전하게 감싸는 헬퍼
function safeIsSupported(fn: () => boolean): boolean {
  try { return fn(); } catch { return false; }
}

// 테스트용 광고 ID (콘솔에서 발급받은 실제 ID로 교체 필요)
const AD_IDS = {
  banner: 'ait.v2.live.6c56d4ac107b4c9e',
  bannerNative: 'ait.v2.live.6c56d4ac107b4c9e',
  interstitial: 'ait.v2.live.020f4a194d394c09',
  rewarded: 'ait.v2.live.020f4a194d394c09',
};

// 배너 광고 훅
export function useTossBanner() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isInitialized) return;

    let cancelled = false;

    const tryInit = () => {
      if (cancelled || isInitialized) return;
      if (!safeIsSupported(TossAds.initialize.isSupported)) return false;

      TossAds.initialize({
        callbacks: {
          onInitialized: () => { if (!cancelled) setIsInitialized(true); },
          onInitializationFailed: (error: any) => {
            console.error('배너 광고 SDK 초기화 실패:', error);
          },
        },
      });
      return true;
    };

    if (!tryInit()) {
      // SDK가 아직 준비 안 됐을 경우 최대 5초 재시도
      const interval = setInterval(() => {
        if (tryInit()) clearInterval(interval);
      }, 200);
      const timer = setTimeout(() => {
        clearInterval(interval);
        console.warn('[BannerAd] TossAds.initialize not supported after timeout');
      }, 5000);

      return () => {
        cancelled = true;
        clearInterval(interval);
        clearTimeout(timer);
      };
    }

    return () => { cancelled = true; };
  }, [isInitialized]);

  const attachBanner = useCallback(
    (adGroupId: string, element: HTMLElement, options?: TossAdsAttachBannerOptions) => {
      if (!isInitialized) return;
      return TossAds.attachBanner(adGroupId, element, options);
    },
    [isInitialized],
  );

  return { isInitialized, attachBanner };
}

// 전면형 광고 훅
export function useInterstitialAd(adGroupId = AD_IDS.interstitial) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (!safeIsSupported(loadFullScreenAd.isSupported)) return;

    const unregister = loadFullScreenAd({
      options: { adGroupId },
      onEvent: (event: any) => {
        if (event.type === 'loaded') setIsLoaded(true);
      },
      onError: (error: any) => {
        console.error('전면 광고 로드 실패:', error);
      },
    });

    return () => unregister();
  }, [adGroupId]);

  const show = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!isLoaded) {
        reject(new Error('광고가 아직 로드되지 않았습니다.'));
        return;
      }

      setIsShowing(true);

      showFullScreenAd({
        options: { adGroupId },
        onEvent: (event) => {
          if (event.type === 'dismissed') {
            setIsShowing(false);
            setIsLoaded(false);
            loadFullScreenAd({
              options: { adGroupId },
              onEvent: (e) => { if (e.type === 'loaded') setIsLoaded(true); },
              onError: console.error,
            });
            resolve();
          }
          if (event.type === 'failedToShow') {
            setIsShowing(false);
            reject(new Error('광고 표시 실패'));
          }
        },
        onError: (error) => {
          setIsShowing(false);
          reject(error);
        },
      });
    });
  }, [isLoaded, adGroupId]);

  return { isLoaded, isShowing, show };
}

// 보상형 광고 훅
export function useRewardedAd(adGroupId = AD_IDS.rewarded) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isShowing, setIsShowing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const rewardRef = useRef(false);

  useEffect(() => {
    let unregister: (() => void) | undefined;
    let cancelled = false;

    const startLoad = () => {
      if (cancelled) return;
      console.log('[RewardedAd] Loading ad:', adGroupId);
      setLoadError(null);
      unregister = loadFullScreenAd({
        options: { adGroupId },
        onEvent: (event) => {
          console.log('[RewardedAd] Load event:', event.type);
          if (event.type === 'loaded') setIsLoaded(true);
        },
        onError: (error) => {
          const msg = JSON.stringify(error);
          console.error('[RewardedAd] Load failed:', error);
          setLoadError(msg);
        },
      });
    };

    if (safeIsSupported(loadFullScreenAd.isSupported)) {
      startLoad();
    } else {
      // SDK 초기화가 늦을 수 있으므로 최대 3초 재시도
      const retryInterval = setInterval(() => {
        if (safeIsSupported(loadFullScreenAd.isSupported)) {
          clearInterval(retryInterval);
          startLoad();
        }
      }, 200);
      const giveUpTimer = setTimeout(() => {
        clearInterval(retryInterval);
        console.warn('[RewardedAd] loadFullScreenAd not supported after timeout');
      }, 5000);

      return () => {
        cancelled = true;
        clearInterval(retryInterval);
        clearTimeout(giveUpTimer);
        unregister?.();
      };
    }

    return () => {
      cancelled = true;
      unregister?.();
    };
  }, [adGroupId]);

  const show = useCallback((): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      if (!isLoaded) {
        reject(new Error('광고가 아직 로드되지 않았습니다.'));
        return;
      }

      setIsShowing(true);
      rewardRef.current = false;

      console.log('[RewardedAd] Showing ad:', adGroupId);
      showFullScreenAd({
        options: { adGroupId },
        onEvent: (event) => {
          console.log('[RewardedAd] Show event:', event.type, event);
          if (event.type === 'userEarnedReward') {
            console.log('[RewardedAd] Reward earned!', event.data);
            rewardRef.current = true;
          }
          if (event.type === 'dismissed') {
            console.log('[RewardedAd] Dismissed, rewarded:', rewardRef.current);
            setIsShowing(false);
            setIsLoaded(false);
            loadFullScreenAd({
              options: { adGroupId },
              onEvent: (e) => { if (e.type === 'loaded') setIsLoaded(true); },
              onError: console.error,
            });
            resolve(rewardRef.current);
          }
          if (event.type === 'failedToShow') {
            console.error('[RewardedAd] Failed to show');
            setIsShowing(false);
            reject(new Error('광고 표시 실패'));
          }
        },
        onError: (error) => {
          console.error('[RewardedAd] Show error:', error);
          setIsShowing(false);
          reject(error);
        },
      });
    });
  }, [isLoaded, adGroupId]);

  return { isLoaded, isShowing, loadError, show };
}

export { AD_IDS };
