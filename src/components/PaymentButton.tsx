import { useState } from 'react';
import { usePayment } from '../hooks/usePayment';

interface Props {
  sku: string;
  label: string;
  onSuccess: (orderId?: string) => void;
  description?: string;
}

export function PaymentButton({ sku, label, onSuccess, description }: Props) {
  const { purchase } = usePayment();
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const orderId = await purchase(sku);
      if (orderId) onSuccess(orderId);
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {description && (
        <p className="text-caption" style={{ textAlign: 'center' }}>
          {description}
        </p>
      )}
      <button
        onClick={handlePurchase}
        disabled={purchasing}
        style={{
          width: '100%',
          padding: '16px 24px',
          borderRadius: '12px',
          background: purchasing ? '#B0B8C1' : '#191F28',
          color: '#FFFFFF',
          fontSize: '15px',
          fontWeight: 700,
          border: 'none',
          cursor: purchasing ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
        }}
      >
        {purchasing ? '결제 중...' : label}
      </button>
    </div>
  );
}
