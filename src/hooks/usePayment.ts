import { useCallback, useEffect, useState } from 'react';

let sdkModule: any = null;
const sdkPromise = import('@apps-in-toss/web-framework').then(m => { sdkModule = m; }).catch(() => {});

const PURCHASES_KEY = 'unse_lab_purchases';

function savePurchaseLocal(sku: string, orderId: string) {
  const purchases = JSON.parse(localStorage.getItem(PURCHASES_KEY) || '[]');
  if (!purchases.some((p: { orderId: string }) => p.orderId === orderId)) {
    purchases.push({ sku, orderId, date: new Date().toISOString() });
    localStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases));
  }
}

export function usePayment() {
  const [, setSdkReady] = useState(!!sdkModule);

  useEffect(() => {
    if (!sdkModule) {
      sdkPromise.then(() => setSdkReady(true));
    }
  }, []);

  // 앱 시작 시 미지급 주문 복구 (결제 후 앱 종료 등으로 상품 미지급된 경우)
  useEffect(() => {
    const recoverPendingOrders = async () => {
      const IAP = sdkModule?.IAP;
      if (!IAP?.getPendingOrders || !IAP?.completeProductGrant) return;
      try {
        const result = await IAP.getPendingOrders();
        for (const order of result?.orders ?? []) {
          savePurchaseLocal(order.sku, order.orderId);
          await IAP.completeProductGrant({ orderId: order.orderId });
        }
      } catch (e) {
        console.warn('Pending order recovery failed:', e);
      }
    };

    if (sdkModule) {
      recoverPendingOrders();
    } else {
      sdkPromise.then(recoverPendingOrders);
    }
  }, []);

  // 서버에서 구매 내역 복원 (기기 변경, 재설치 대응)
  const restorePurchases = useCallback(async (): Promise<void> => {
    const IAP = sdkModule?.IAP;
    if (!IAP?.getCompletedOrRefundedOrders) return;
    try {
      const result = await IAP.getCompletedOrRefundedOrders();
      const refundedOrderIds = new Set<string>();
      for (const order of result?.orders ?? []) {
        if (order.status === 'COMPLETED') {
          savePurchaseLocal(order.sku, order.orderId);
        } else if (order.status === 'REFUNDED') {
          refundedOrderIds.add(order.orderId);
        }
      }
      // 환불된 주문을 localStorage에서 제거
      if (refundedOrderIds.size > 0) {
        const purchases = JSON.parse(localStorage.getItem(PURCHASES_KEY) || '[]');
        const filtered = purchases.filter((p: { orderId: string }) => !refundedOrderIds.has(p.orderId));
        localStorage.setItem(PURCHASES_KEY, JSON.stringify(filtered));
      }
    } catch (e) {
      console.warn('Purchase restore failed:', e);
    }
  }, []);

  const purchase = useCallback((sku: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const IAP = sdkModule?.IAP;

      // 웹 환경에서는 createOneTimePurchaseOrder 내부에서 throw 발생 → 결제 우회
      let cleanup: (() => void) | undefined;
      try {
        cleanup = IAP?.createOneTimePurchaseOrder({
          options: {
            sku,
            processProductGrant: async ({ orderId }: { orderId: string }) => {
              try {
                savePurchaseLocal(sku, orderId);
                return true;
              } catch {
                return false;
              }
            },
          },
          onEvent: (event: { type: string; data?: { orderId: string } }) => {
            if (event.type === 'success') {
              resolve(event.data?.orderId ?? null);
              cleanup?.();
            }
          },
          onError: (error: unknown) => {
            const err = error as { errorCode?: string; message?: string };
            console.error('[IAP] Purchase failed:', err.errorCode, err.message, error);
            alert(`결제 오류: ${err.errorCode || '알 수 없음'}\n${err.message || ''}`);
            resolve(null);
            cleanup?.();
          },
        });
      } catch {
        // 웹 환경: IAP 미지원으로 throw → 결제 없이 성공 처리
        resolve('web-bypass');
      }
    });
  }, []);

  // localStorage 기반 동기 확인 (UI 렌더링용)
  const hasPurchased = useCallback((sku: string): boolean => {
    const purchases = JSON.parse(localStorage.getItem(PURCHASES_KEY) || '[]');
    return purchases.some((p: { sku: string }) => p.sku === sku);
  }, []);

  // 테스트/환불용 초기화
  const resetPurchase = useCallback((sku: string) => {
    const purchases = JSON.parse(localStorage.getItem(PURCHASES_KEY) || '[]');
    const filtered = purchases.filter((p: { sku: string }) => p.sku !== sku);
    localStorage.setItem(PURCHASES_KEY, JSON.stringify(filtered));
  }, []);

  return { purchase, hasPurchased, restorePurchases, resetPurchase };
}
