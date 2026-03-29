interface Props {
  icon: string;
  title: string;
  message: string;
  score?: number;
  delay?: number;
}

export function FortuneCard({ icon, title, message, score, delay = 0 }: Props) {
  return (
    <div
      className="card animate-fade-in"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'backwards',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <span style={{ fontSize: '15px', fontWeight: 600 }}>{title}</span>
        {score !== undefined && (
          <span style={{
            marginLeft: 'auto',
            fontSize: '16px',
            fontWeight: 700,
            color: score >= 80 ? '#10B981' : score >= 60 ? '#3182F6' : score >= 40 ? '#F59E0B' : '#EF4444',
          }}>
            {score}점
          </span>
        )}
      </div>
      <p className="text-body">{message}</p>
    </div>
  );
}
