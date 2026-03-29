import { useState, useEffect } from 'react';

interface Props {
  score: number;
  size?: number;
  label?: string;
  delay?: number;
}

export function ScoreCircle({ score, size = 100, label, delay = 0 }: Props) {
  const [displayScore, setDisplayScore] = useState(0);
  const [visible, setVisible] = useState(false);
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!visible) return;
    let current = 0;
    const step = score / 30;
    const timer = setInterval(() => {
      current += step;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.round(current));
      }
    }, 20);
    return () => clearInterval(timer);
  }, [score, visible]);

  const scoreColor = score >= 80 ? '#10B981' : score >= 60 ? '#3182F6' : score >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6px',
      opacity: visible ? 1 : 0,
      transform: visible ? 'scale(1)' : 'scale(0.85)',
      transition: 'all 0.4s ease',
    }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E8EB"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={scoreColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#191F28"
          fontSize={size * 0.28}
          fontWeight="700"
          style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
        >
          {displayScore}
        </text>
      </svg>
      {label && (
        <span style={{
          color: '#8B95A1',
          fontSize: '12px',
          fontWeight: 500,
        }}>
          {label}
        </span>
      )}
    </div>
  );
}
