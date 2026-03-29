import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  right?: ReactNode;
}

export function PageHeader({ title, right }: PageHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0 12px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)', flex: 1 }}>{title}</h1>
      {right}
    </div>
  );
}
