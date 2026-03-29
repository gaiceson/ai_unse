import { useBirthday, useFortuneHistory } from '../hooks/useStorage';
import { usePayment } from '../hooks/usePayment';
import { BirthdayInput } from '../components/BirthdayInput';
import { PageHeader } from '../components/PageHeader';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SKU_LABELS: Record<string, string> = {
  'ait.0000021209.41ffef4d.d04934f5b4.3251499485': '타로 추가 리딩 · 550원',
  'ait.0000021209.6f7520d0.e123db32c3.3252096438': '사주 분석 · 2,200원',
  'ait.0000021209.c1de367a.173e5848dd.3279699307': '궁합 분석 · 2,200원',
  'ait.0000021209.2220458c.e789367624.3340251676': 'AI 운세 상담 · 2,200원',
};

interface PurchaseRecord {
  sku: string;
  orderId: string;
  date: string;
}

export function MyPage() {
  const navigate = useNavigate();
  const { birthday, setBirthday, clearBirthday, hasBirthday } = useBirthday();
  const { history, clearHistory } = useFortuneHistory();
  const { restorePurchases } = usePayment();
  const [editMode, setEditMode] = useState(false);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('unse_lab_purchases') || '[]');
    setPurchases(data);
  }, []);

  const handleRestore = async () => {
    setRestoring(true);
    await restorePurchases();
    const data = JSON.parse(localStorage.getItem('unse_lab_purchases') || '[]');
    setPurchases(data);
    setRestoring(false);
  };

  const handleDisconnect = () => {
    clearBirthday();
    navigate('/', { replace: true });
  };

  return (
    <div className="page">
      <PageHeader title="마이페이지" />

      {/* Birthday Info */}
      <div className="card" style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 className="section-title" style={{ marginBottom: 0 }}>내 생년월일</h3>
          {hasBirthday && !editMode && (
            <button
              onClick={() => setEditMode(true)}
              style={{ color: 'var(--color-primary)', fontSize: '13px', fontWeight: 600 }}
            >
              수정
            </button>
          )}
        </div>

        {editMode || !hasBirthday ? (
          <BirthdayInput
            onSubmit={(data) => {
              setBirthday(data);
              setEditMode(false);
            }}
            showTime
            showGender
            initialData={birthday}
          />
        ) : birthday ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-caption">생년월일</span>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>
                {birthday.year}년 {birthday.month}월 {birthday.day}일
                {birthday.isLunar ? ' (음력)' : ' (양력)'}
              </span>
            </div>
            {birthday.hour !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-caption">태어난 시간</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{birthday.hour}시</span>
              </div>
            )}
            {birthday.gender && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-caption">성별</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{birthday.gender === 'male' ? '남성' : '여성'}</span>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Purchase History */}
      <div className="card" style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="section-title" style={{ marginBottom: 0 }}>결제 내역</h3>
          <button
            onClick={handleRestore}
            disabled={restoring}
            style={{ color: 'var(--color-primary)', fontSize: '13px', fontWeight: 600, opacity: restoring ? 0.5 : 1 }}
          >
            {restoring ? '복원 중...' : '구매 복원'}
          </button>
        </div>

        {purchases.length === 0 ? (
          <p className="text-caption" style={{ textAlign: 'center', padding: '20px' }}>
            결제 내역이 없어요
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--color-divider)', borderRadius: '12px', overflow: 'hidden' }}>
            {purchases.slice().reverse().map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: 'var(--bg-white)',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 600 }}>
                  {SKU_LABELS[item.sku] ?? item.sku}
                </span>
                <span className="text-caption" style={{ fontSize: '12px' }}>
                  {new Date(item.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      <div className="card" style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="section-title" style={{ marginBottom: 0 }}>분석 기록</h3>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              style={{ color: 'var(--color-danger)', fontSize: '13px', fontWeight: 600 }}
            >
              전체 삭제
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p className="text-caption" style={{ textAlign: 'center', padding: '20px' }}>
            아직 분석 기록이 없어요
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--color-divider)', borderRadius: '12px', overflow: 'hidden' }}>
            {history.slice(0, 20).map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  background: 'var(--bg-white)',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{item.type}</span>
                    <span className="text-caption" style={{ fontSize: '12px' }}>
                      {new Date(item.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-caption" style={{ lineHeight: 1.4 }}>
                    {item.summary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toss Login Disconnect */}
      <div className="card">
        <h3 className="section-title" style={{ marginBottom: '12px' }}>계정</h3>
        <button
          onClick={handleDisconnect}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: '10px',
            border: '1px solid var(--color-divider)',
            background: 'none',
            color: 'var(--color-danger)',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          토스 로그인 연결 끊기
        </button>
      </div>
    </div>
  );
}
