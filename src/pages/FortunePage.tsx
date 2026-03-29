import { useState, useEffect, useRef } from 'react';
import { loadFullScreenAd } from '@apps-in-toss/web-framework';
import { useBirthday, useCachedResult, useFortuneHistory } from '../hooks/useStorage';
import { getFortune, type FortuneResult } from '../services/fortune';
import { BirthdayInput } from '../components/BirthdayInput';
import { ScoreCircle } from '../components/ScoreCircle';
import { FortuneCard } from '../components/FortuneCard';
import { AdRewardGate } from '../components/AdRewardGate';
import { ShareCard } from '../components/ShareCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { BannerAd } from '../components/BannerAd';
import { PageHeader } from '../components/PageHeader';
import type { BirthdayData } from '../hooks/useStorage';

function BirthdayChip({ birthday, onEdit }: { birthday: BirthdayData; onEdit: () => void }) {
  const timeStr = birthday.hour !== undefined ? ` · ${birthday.hour}시` : '';
  const calStr = birthday.isLunar ? '음력' : '양력';
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'var(--color-primary-light)',
      borderRadius: '12px',
      padding: '10px 16px',
      marginBottom: '16px',
    }}>
      <span style={{ fontSize: '14px', color: 'var(--color-text)' }}>
        {calStr} {birthday.year}.{birthday.month}.{birthday.day}{timeStr}
      </span>
      <button
        onClick={onEdit}
        style={{
          fontSize: '13px',
          color: 'var(--color-primary)',
          fontWeight: 600,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0',
        }}
      >
        수정
      </button>
    </div>
  );
}

export function FortunePage() {
  const { birthday, setBirthday, hasBirthday } = useBirthday();
  const { getCached, setCache } = useCachedResult('fortune');
  const { addHistory } = useFortuneHistory();
  const [result, setResult] = useState<FortuneResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchFortune = async (data?: BirthdayData) => {
    const bd = data || birthday;
    if (!bd) return;
    setLoading(true);
    setError(null);
    try {
      const fortune = await getFortune(bd.year, bd.month, bd.day);
      setResult(fortune);
      setCache(JSON.stringify(fortune));
      addHistory({ type: '오늘의 운세', summary: fortune.overall.message });
    } catch (e) {
      setError('운세를 불러오지 못했어요. 다시 시도해주세요.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdRewarded = () => {
    setShowResult(true);
    if (!result) fetchFortune();
  };

  const handleBirthdaySubmit = (data: BirthdayData) => {
    setBirthday(data);
    setIsEditing(false);
    setResult(null);
    setShowResult(false);
  };

  // 캐시 결과 로드
  useEffect(() => {
    if (!hasBirthday) return;
    const cached = getCached();
    if (cached) {
      setResult(JSON.parse(cached));
      setShowResult(true);
    }
  }, [hasBirthday, getCached]);

  // 웹(비 Toss 앱) 환경에서는 광고 게이트를 우회하여 운세를 바로 표시
  const fetchFortuneRef = useRef(fetchFortune);
  fetchFortuneRef.current = fetchFortune;
  useEffect(() => {
    if (!hasBirthday || showResult) return;
    // Toss SDK 초기화 대기(최대 3초) 후 웹 여부 확인
    const timer = setTimeout(() => {
      let adSupported = false;
      try { adSupported = loadFullScreenAd.isSupported(); } catch { }
      if (!adSupported) {
        setShowResult(true);
        fetchFortuneRef.current();
      }
    }, 3200);
    return () => clearTimeout(timer);
  }, [hasBirthday, showResult]);

  // 편집 모드
  if (!hasBirthday || isEditing) {
    return (
      <div className="page">
        <PageHeader title="오늘의 운세" />
        {isEditing && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p className="text-caption">생년월일을 수정해주세요</p>
            <button
              onClick={() => setIsEditing(false)}
              style={{ fontSize: '13px', color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              취소
            </button>
          </div>
        )}
        {!isEditing && (
          <p className="text-caption" style={{ marginBottom: '24px' }}>
            생년월일을 입력하면 오늘의 운세를 분석해드려요
          </p>
        )}
        <BirthdayInput
          onSubmit={handleBirthdaySubmit}
          showTime
          initialData={birthday}
        />
      </div>
    );
  }

  // Ad gate
  if (!showResult && !loading) {
    return (
      <div className="page">
        <PageHeader title="오늘의 운세" />
        {birthday && <BirthdayChip birthday={birthday} onEdit={() => setIsEditing(true)} />}
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔮</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
            오늘의 운세가 준비됐어요
          </h2>
          <AdRewardGate
            onRewarded={handleAdRewarded}
            onSkip={handleAdRewarded}
            buttonText="광고 보고 운세 확인"
            description="짧은 광고 후 결과를 확인할 수 있어요"
          />
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="page">
        <PageHeader title="오늘의 운세" />
        <LoadingSpinner />
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="page">
        <PageHeader title="오늘의 운세" />
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ color: 'var(--color-danger)', marginBottom: '16px' }}>{error}</p>
          <button className="btn-primary" onClick={() => fetchFortune()}>다시 시도</button>
        </div>
      </div>
    );
  }

  // Result
  if (!result) return null;

  return (
    <div className="page">
      <h1 className="page-title">오늘의 운세</h1>

      {birthday && <BirthdayChip birthday={birthday} onEdit={() => setIsEditing(true)} />}

      {/* Overall score */}
      <div className="card" style={{ textAlign: 'center', marginBottom: '12px' }}>
        <p className="text-caption" style={{ marginBottom: '16px' }}>
          {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
        <ScoreCircle score={result.overall.score} size={130} label="종합 운세" />
        <p style={{
          marginTop: '16px',
          fontSize: '15px',
          lineHeight: 1.6,
          color: 'var(--color-text)',
        }}>
          {result.overall.message}
        </p>
      </div>

      {/* Category scores */}
      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '12px' }}>
        <ScoreCircle score={result.love.score} size={64} label="연애" delay={200} />
        <ScoreCircle score={result.money.score} size={64} label="재물" delay={400} />
        <ScoreCircle score={result.health.score} size={64} label="건강" delay={600} />
        <ScoreCircle score={result.luck.score} size={64} label="행운" delay={800} />
      </div>

      {/* Detailed cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
        <FortuneCard icon="💕" title="연애운" message={result.love.message} score={result.love.score} delay={300} />
        <FortuneCard icon="💰" title="재물운" message={result.money.message} score={result.money.score} delay={500} />
        <FortuneCard icon="💪" title="건강운" message={result.health.message} score={result.health.score} delay={700} />
        <FortuneCard icon="🍀" title="행운" message={result.luck.message} score={result.luck.score} delay={900} />
      </div>

      {/* Detail */}
      <div className="card" style={{ marginBottom: '12px' }}>
        <h3 className="section-title">상세 해석</h3>
        <p className="text-body" style={{ lineHeight: 1.8 }}>{result.detail}</p>
      </div>

      {/* Timing */}
      {result.timing && (
        <div className="card" style={{ marginBottom: '12px' }}>
          <h3 className="section-title">⏰ 오늘의 타이밍</h3>
          <p className="text-body">{result.timing}</p>
        </div>
      )}

      {/* Lucky items */}
      <div className="card" style={{ marginBottom: '12px' }}>
        <h3 className="section-title">오늘의 행운</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { label: '행운의 아이템', value: result.luckyItem },
            { label: '행운의 색상', value: result.luckyColor },
            { label: '행운의 숫자', value: result.luckyNumber },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-caption">{row.label}</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Advice */}
      <div className="card" style={{
        marginBottom: '20px',
        background: 'var(--color-primary-light)',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-primary)' }}>
          {result.advice}
        </p>
      </div>

      {/* Share */}
      <ShareCard
        title="오늘의 운세"
        score={result.overall.score}
        message={[
          result.overall.message,
          `💕 연애 ${result.love.score}점: ${result.love.message}`,
          `💰 재물 ${result.money.score}점: ${result.money.message}`,
          `💪 건강 ${result.health.score}점: ${result.health.message}`,
          `🍀 행운 ${result.luck.score}점: ${result.luck.message}`,
          `📖 상세 해석:\n${result.detail}`,
          result.timing ? `⏰ 오늘의 타이밍: ${result.timing}` : '',
          `🎁 행운의 아이템: ${result.luckyItem}  |  색상: ${result.luckyColor}  |  숫자: ${result.luckyNumber}`,
          `💡 ${result.advice}`,
        ].filter(Boolean).join('\n\n')}
        type="오늘의 운세"
      />

      {/* Banner Ad */}
      <BannerAd />
    </div>
  );
}
