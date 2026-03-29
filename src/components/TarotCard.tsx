import { useState } from 'react';
import type { TarotCardData } from '../data/tarot-deck';

interface Props {
  card: TarotCardData & { isReversed: boolean };
  revealed: boolean;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const SIZES = {
  small: { width: 80, height: 120, fontSize: 28 },
  medium: { width: 110, height: 165, fontSize: 36 },
  large: { width: 140, height: 210, fontSize: 48 },
};

export function TarotCard({ card, revealed, onClick, size = 'medium' }: Props) {
  const [flipping, setFlipping] = useState(false);
  const dim = SIZES[size];

  const handleClick = () => {
    if (revealed || flipping) return;
    setFlipping(true);
    setTimeout(() => {
      setFlipping(false);
      onClick?.();
    }, 600);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        width: dim.width,
        height: dim.height,
        perspective: '600px',
        cursor: revealed ? 'default' : 'pointer',
      }}
    >
      <div style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        transformStyle: 'preserve-3d',
        transform: revealed || flipping ? 'rotateY(180deg)' : 'rotateY(0deg)',
        transition: 'transform 0.6s ease',
      }}>
        {/* Back face */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #3182F6, #1B64DA)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(49, 130, 246, 0.2)',
        }}>
          <div style={{
            width: '60%',
            height: '60%',
            borderRadius: '8px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: dim.fontSize * 0.6, opacity: 0.5, color: 'white' }}>?</span>
          </div>
        </div>

        {/* Front face */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          borderRadius: '12px',
          background: '#FFFFFF',
          border: '1px solid #E5E8EB',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px',
          gap: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}>
          <span style={{
            fontSize: dim.fontSize,
            transform: card.isReversed ? 'rotate(180deg)' : 'none',
          }}>
            {card.emoji}
          </span>
          <span style={{
            fontSize: size === 'small' ? '9px' : '11px',
            color: '#191F28',
            textAlign: 'center',
            fontWeight: 600,
            lineHeight: 1.2,
          }}>
            {card.nameKo}
          </span>
          {card.isReversed && (
            <span style={{
              fontSize: '9px',
              color: 'var(--color-danger)',
              fontWeight: 500,
            }}>
              역방향
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
