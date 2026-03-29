import { useState, useEffect, useCallback, useRef } from 'react';

interface ShowAdCallbacks {
  onRewarded?: () => void;
  onDismissed?: () => void;
  onError?: () => void;
}

let sdkModule: any = null;
const sdkPromise = import('@apps-in-toss/web-framework').then(m => { sdkModule = m; }).catch(() => {});

function checkSupported(fn: any): boolean {
  try {
    return fn?.isSupported?.() === true;
  } catch {
    return false;
  }
}

export function useAd(adGroupId: string) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [sdkReady, setSdkReady] = useState(!!sdkModule);
  const unregisterRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!sdkReady) {
      sdkPromise.then(() => setSdkReady(true));
    }
  }, [sdkReady]);

  const loadFn = sdkModule?.loadFullScreenAd;
  const showFn = sdkModule?.showFullScreenAd;
  const isSupported = checkSupported(loadFn);

  const loadAd = useCallback(() => {
    if (!isSupported || !loadFn) return;
    setIsLoaded(false);

    try {
      unregisterRef.current?.();
      unregisterRef.current = loadFn({
        options: { adGroupId },
        onEvent: (event: { type: string }) => {
          if (event.type === 'loaded') {
            setIsLoaded(true);
          }
        },
        onError: (error: unknown) => {
          console.error('Ad load failed:', error);
        },
      });
    } catch (e) {
      console.warn('Ad load error:', e);
    }
  }, [adGroupId, isSupported, loadFn]);

  useEffect(() => {
    loadAd();
    return () => {
      unregisterRef.current?.();
    };
  }, [loadAd]);

  const showAd = useCallback(({ onRewarded, onDismissed, onError }: ShowAdCallbacks) => {
    if (!isSupported || !showFn) {
      onError?.();
      return;
    }

    try {
      const cleanup = showFn({
        options: { adGroupId },
        onEvent: (event: { type: string; data?: { unitType: string; unitAmount: number } }) => {
          switch (event.type) {
            case 'userEarnedReward':
              onRewarded?.();
              break;
            case 'dismissed':
              onDismissed?.();
              setIsLoaded(false);
              loadAd();
              cleanup?.();
              break;
            case 'failedToShow':
              onError?.();
              cleanup?.();
              break;
          }
        },
        onError: () => {
          onError?.();
          cleanup?.();
        },
      });
    } catch {
      onError?.();
    }
  }, [adGroupId, isSupported, showFn, loadAd]);

  return { isLoaded, isSupported, showAd, loadAd };
}
