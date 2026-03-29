import { useState, useEffect, useCallback } from 'react';
import { useBirthday, useFortuneHistory, type BirthdayData } from '../hooks/useStorage';
import { PageHeader } from '../components/PageHeader';
import { getSaju, type SajuResult } from '../services/saju';
import { calculateSaju, type SajuPillars } from '../services/saju-calculator';
import { toSolarDate } from '../utils/lunar-solar';
import { getPersonalizedInsights } from '../services/saju-personalizer';
import { BirthdayInput } from '../components/BirthdayInput';
import { PaymentButton } from '../components/PaymentButton';
import { ShareCard } from '../components/ShareCard';
import { SajuLoadingScreen } from '../components/SajuLoadingScreen';
import { usePayment } from '../hooks/usePayment';

const FIVE_ELEMENTS: Record<string, { color: string; label: string }> = {
  wood: { color: '#10B981', label: '목' },
  fire: { color: '#EF4444', label: '화' },
  earth: { color: '#F59E0B', label: '토' },
  metal: { color: '#94A3B8', label: '금' },
  water: { color: '#3B82F6', label: '수' },
};

const ELEMENT_NAMES: Record<string, string> = {
  wood: '목(木)', fire: '화(火)', earth: '토(土)', metal: '금(金)', water: '수(水)',
};

const PURCHASED_KEY_STORAGE = 'saju_purchased_bday_key';
const PURCHASED_LIST_KEY = 'saju_purchased_list';

interface PurchasedRecord {
  birthdayKey: string;
  label: string;
  date: string;
}

const DETAIL_SECTIONS = [
  { key: 'wealth',        title: '재물운',         icon: '💰' },
  { key: 'marriage',      title: '연애 / 결혼',    icon: '💕' },
  { key: 'yearlyFortune', title: '올해 운세',      icon: '📅' },
  { key: 'career',        title: '직업운',         icon: '💼' },
  { key: 'relationship',  title: '인간관계',       icon: '🤝' },
  { key: 'health',        title: '건강운',         icon: '💪' },
  { key: 'luckyInfo',     title: '행운 정보',      icon: '🍀' },
  { key: 'lifeFlow',      title: '인생 전체 흐름', icon: '🌊' },
] as const;

function makeBirthdayKey(b: BirthdayData) {
  return `${b.year}-${b.month}-${b.day}-${b.hour ?? 'x'}-${b.gender ?? 'x'}-${b.isLunar ? 'L' : 'S'}`;
}

function makeBirthdayLabel(b: BirthdayData) {
  const cal = b.isLunar ? '음력' : '양력';
  const time = b.hour !== undefined ? ` · ${b.hour}시` : '';
  const gender = b.gender === 'female' ? ' · 여성' : b.gender === 'male' ? ' · 남성' : '';
  return `${cal} ${b.year}.${b.month}.${b.day}${time}${gender}`;
}

function loadCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch { return null; }
}

function saveCache(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function loadPurchasedList(): PurchasedRecord[] {
  return loadCache<PurchasedRecord[]>(PURCHASED_LIST_KEY) ?? [];
}

function savePurchasedRecord(birthdayKey: string, label: string) {
  const list = loadPurchasedList();
  if (list.some(r => r.birthdayKey === birthdayKey)) return;
  list.unshift({ birthdayKey, label, date: new Date().toISOString() });
  saveCache(PURCHASED_LIST_KEY, list);
}

function PreviousAnalysisCard({ record, onClose }: { record: PurchasedRecord; onClose: () => void }) {
  const cached = loadCache<SajuResult>(`saju_detail_${record.birthdayKey}`);
  if (!cached) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
      {DETAIL_SECTIONS.map(sec => {
        const text = cached[sec.key as keyof SajuResult] as string | undefined;
        if (!text) return null;
        return (
          <div key={sec.key} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '16px' }}>{sec.icon}</span>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>{sec.title}</h4>
            </div>
            <p className="text-body" style={{ lineHeight: 1.8, fontSize: '14px' }}>{text}</p>
          </div>
        );
      })}
      <button
        onClick={onClose}
        style={{ fontSize: '13px', color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0' }}
      >
        닫기
      </button>
    </div>
  );
}

export function SajuPage() {
  const { birthday, setBirthday, hasBirthday } = useBirthday();
  const { addHistory } = useFortuneHistory();
  const { resetPurchase } = usePayment();

  // 로컬 계산 결과 (즉시 표시)
  const [pillars, setPillars] = useState<SajuPillars | null>(null);
  // AI 기본 해석 (백그라운드 로딩, 전체 화면 로딩 없음)
  const [result, setResult] = useState<SajuResult | null>(null);
  const [basicAILoading, setBasicAILoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // AI 상세 해석 (결제 후 1번만 전체 화면 로딩)
  const [detailedResult, setDetailedResult] = useState<SajuResult | null>(null);
  const [detailedLoading, setDetailedLoading] = useState(false);
  const [detailedDone, setDetailedDone] = useState(false);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [expandedPrevKey, setExpandedPrevKey] = useState<string | null>(null);

  const birthdayKey = birthday ? makeBirthdayKey(birthday) : null;
  const purchasedBdKey = localStorage.getItem(PURCHASED_KEY_STORAGE);
  const hasPreviousPurchaseWarning = !!purchasedBdKey && purchasedBdKey !== birthdayKey;
  const previousRecords = loadPurchasedList().filter(r => r.birthdayKey !== birthdayKey);

  // 마운트: 캐시 & 구매 복원
  useEffect(() => {
    if (!birthday || !birthdayKey) return;
    const basicCached = loadCache<SajuResult>(`saju_basic_${birthdayKey}`);
    if (basicCached) {
      setResult(basicCached);
      setPillars({ fourPillars: basicCached.fourPillars, fiveElements: basicCached.fiveElements, mainElement: basicCached.mainElement });
    } else {
      // 캐시 없어도 로컬 계산으로 즉시 표시 (음력이면 양력 변환 후 계산)
      const solar = toSolarDate(birthday.year, birthday.month, birthday.day, birthday.isLunar ?? false);
      const calc = calculateSaju(solar.year, solar.month, solar.day, birthday.hour ?? 0);
      setPillars(calc);
    }

    const storedKey = localStorage.getItem(PURCHASED_KEY_STORAGE);
    if (storedKey === birthdayKey) {
      setIsPurchased(true);
      const detailedCached = loadCache<SajuResult>(`saju_detail_${birthdayKey}`);
      if (detailedCached) {
        setDetailedResult(detailedCached);
        // localStorage에만 있고 DB에 없을 경우 재동기화 (백그라운드)
        import('../utils/lunar-solar').then(({ toSolarDate }) => {
          const solar = toSolarDate(birthday.year, birthday.month, birthday.day, birthday.isLunar ?? false);
          const h = birthday.hour ?? 0;
          const g = birthday.gender ?? 'male';
          import('../services/db-saju').then(({ getSajuFromCache, saveSajuToCache }) => {
            getSajuFromCache(solar.year, solar.month, solar.day, h, g).then(cached => {
              if (!cached) {
                saveSajuToCache(solar.year, solar.month, solar.day, h, g, detailedCached)
                  .catch(console.warn);
              }
            });
          });
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 기본 AI 해석 (캐시 없을 때만, 전체 화면 로딩 없이 백그라운드)
  useEffect(() => {
    if (!hasBirthday || !birthday || basicAILoading || error) return;
    const bdKey = makeBirthdayKey(birthday);
    if (!loadCache(`saju_basic_${bdKey}`)) fetchBasicAI(birthday);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasBirthday]);

  // 구매됐는데 상세 결과 없으면 자동 로드
  useEffect(() => {
    if (isPurchased && !detailedResult && !detailedLoading && !detailedError && birthday && birthdayKey) {
      fetchDetailed(birthdayKey, birthday);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPurchased]);

  // 로컬 계산 + 백그라운드 AI 해석 (전체 화면 로딩 없음)
  const analyze = (data: BirthdayData) => {
    setBirthday(data);
    setError(null);
    // 즉시 로컬 계산 표시 (음력이면 양력 변환 후 계산)
    const solar = toSolarDate(data.year, data.month, data.day, data.isLunar ?? false);
    const calc = calculateSaju(solar.year, solar.month, solar.day, data.hour ?? 0);
    setPillars(calc);
    // AI 해석 백그라운드 fetch
    fetchBasicAI(data);
  };

  const fetchBasicAI = async (data: BirthdayData) => {
    setBasicAILoading(true);
    setError(null);
    try {
      const r = await getSaju(
        data.year, data.month, data.day,
        data.hour ?? 0, data.gender ?? 'male',
        data.isLunar ?? false, false,
      );
      setResult(r);
      saveCache(`saju_basic_${makeBirthdayKey(data)}`, r);
      addHistory({ type: '사주 분석', summary: r.keywords.join(' · ').slice(0, 40) });
    } catch {
      setError('AI 해석에 실패했어요. 다시 시도해주세요.');
    } finally {
      setBasicAILoading(false);
    }
  };

  const fetchDetailed = useCallback(async (bdKey: string, data: BirthdayData) => {
    setDetailedLoading(true);
    setDetailedError(null);
    try {
      const MIN_LOADING_MS = 2500;
      const [r] = await Promise.all([
        getSaju(
          data.year, data.month, data.day,
          data.hour ?? 0, data.gender ?? 'male',
          data.isLunar ?? false, true,
        ),
        new Promise(resolve => setTimeout(resolve, MIN_LOADING_MS)),
      ]);

      saveCache(`saju_detail_${bdKey}`, r as typeof r);
      setDetailedResult(r as typeof r);
      // 완료 애니메이션 재생 후 로딩 화면 닫기
      setDetailedDone(true);
      await new Promise(resolve => setTimeout(resolve, 700));
    } catch {
      setDetailedError('상세 분석에 실패했어요. 다시 시도해주세요.');
    } finally {
      setDetailedLoading(false);
      setDetailedDone(false);
    }
  }, []);

  const handlePurchaseSuccess = useCallback(() => {
    if (!birthday || !birthdayKey) return;
    localStorage.setItem(PURCHASED_KEY_STORAGE, birthdayKey);
    savePurchasedRecord(birthdayKey, makeBirthdayLabel(birthday));
    setIsPurchased(true);
    fetchDetailed(birthdayKey, birthday);
  }, [birthday, birthdayKey, fetchDetailed]);

  const handleBirthdaySubmit = (data: BirthdayData) => {
    const newKey = makeBirthdayKey(data);
    setIsEditing(false);
    setError(null);
    setDetailedError(null);

    if (newKey === birthdayKey) return;

    setResult(null);
    setDetailedResult(null);
    setPillars(null);
    setIsPurchased(false);
    resetPurchase('saju_detail_2200');

    const basicCached = loadCache<SajuResult>(`saju_basic_${newKey}`);
    if (basicCached) {
      setBirthday(data);
      setResult(basicCached);
      setPillars({ fourPillars: basicCached.fourPillars, fiveElements: basicCached.fiveElements, mainElement: basicCached.mainElement });
      const storedKey = localStorage.getItem(PURCHASED_KEY_STORAGE);
      if (storedKey === newKey) {
        setIsPurchased(true);
        const detailedCached = loadCache<SajuResult>(`saju_detail_${newKey}`);
        if (detailedCached) setDetailedResult(detailedCached);
      }
    } else {
      analyze(data);
    }
  };

  // ── 생년월일 입력 화면 / 로컬 계산 전 ──
  if (!hasBirthday || isEditing || !pillars) {
    return (
      <div className="page">
        <PageHeader title="사주 분석" />
        {isEditing ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p className="text-caption">생년월일을 수정해주세요</p>
            <button
              onClick={() => setIsEditing(false)}
              style={{ fontSize: '13px', color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              취소
            </button>
          </div>
        ) : (
          <p className="text-caption" style={{ marginBottom: '24px' }}>
            생년월일시와 성별을 입력하면 사주팔자를 분석해드려요
          </p>
        )}
        {isEditing && (isPurchased || hasPreviousPurchaseWarning) && (
          <div style={{
            background: '#FFF3CD', border: '1px solid #FBBF24',
            borderRadius: '10px', padding: '12px 16px', marginBottom: '16px',
            fontSize: '13px', color: '#92400E', lineHeight: 1.6,
          }}>
            ⚠️ 생년월일 또는 태어난 시간을 변경하면<br />
            <strong>새로운 사주 분석이 필요합니다</strong>
          </div>
        )}
        <BirthdayInput onSubmit={handleBirthdaySubmit} showTime showGender initialData={birthday} />
      </div>
    );
  }

  // 결제 후 상세 분석 로딩 (유일한 전체 화면 로딩)
  if (detailedLoading) {
    return (
      <div className="page">
        <PageHeader title="사주 분석" />
        <SajuLoadingScreen detailed={true} done={detailedDone} />
      </div>
    );
  }

  const fp = pillars.fourPillars;
  const timeStr = birthday?.hour !== undefined ? ` · ${birthday.hour}시` : '';
  const calStr = birthday?.isLunar ? '음력' : '양력';
  const genderStr = birthday?.gender === 'female' ? ' · 여성' : birthday?.gender === 'male' ? ' · 남성' : '';

  return (
    <div className="page">
      <h1 className="page-title">사주 분석</h1>

      {/* 이미 분석한 사주 배너 */}
      {isPurchased && detailedResult && (
        <div style={{
          background: 'var(--color-primary-light)', borderRadius: '12px',
          padding: '12px 16px', marginBottom: '16px', textAlign: 'center',
        }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)' }}>이미 분석한 사주입니다</p>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>언제든 다시 확인할 수 있습니다</p>
        </div>
      )}

      {/* Birthday chip */}
      {birthday && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--color-primary-light)', borderRadius: '12px',
          padding: '10px 16px', marginBottom: '16px',
        }}>
          <span style={{ fontSize: '14px', color: 'var(--color-text)' }}>
            {calStr} {birthday.year}.{birthday.month}.{birthday.day}{timeStr}{genderStr}
          </span>
          <button
            onClick={() => setIsEditing(true)}
            style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: '0' }}
          >
            수정
          </button>
        </div>
      )}

      {/* Four Pillars */}
      <div className="card" style={{ marginBottom: '12px' }}>
        <h3 className="section-title">사주팔자</h3>
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          {(['year', 'month', 'day', 'hour'] as const).map((pillar, i) => (
            <div key={pillar} style={{
              display: 'flex', flexDirection: 'column', gap: '6px',
              opacity: 0, animation: `fadeIn 0.4s ease ${i * 100}ms forwards`,
            }}>
              <span className="text-caption">
                {pillar === 'year' ? '년주' : pillar === 'month' ? '월주' : pillar === 'day' ? '일주' : '시주'}
              </span>
              <div style={{ background: 'var(--color-primary-light)', borderRadius: '12px', padding: '12px 16px' }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-primary)' }}>{fp[pillar].heavenly}</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-warning)' }}>{fp[pillar].earthly}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Five Elements */}
      <div className="card" style={{ marginBottom: '12px' }}>
        <h3 className="section-title">
          오행 분포 <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{pillars.mainElement}</span>
        </h3>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '80px' }}>
          {Object.entries(pillars.fiveElements).map(([key, value]) => {
            const el = FIVE_ELEMENTS[key];
            return (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: el.color }}>{value}</span>
                <div style={{ width: '36px', height: `${value * 16}px`, minHeight: '8px', background: el.color, borderRadius: '6px', transition: 'height 0.5s ease' }} />
                <span className="text-caption">{ELEMENT_NAMES[key]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 핵심 키워드 */}
      <div className="card" style={{ marginBottom: '12px' }}>
        <h3 className="section-title">당신의 사주 핵심 키워드</h3>
        {basicAILoading ? (
          <p className="text-caption" style={{ marginTop: '8px' }}>AI 해석 중...</p>
        ) : error ? (
          <div style={{ marginTop: '8px' }}>
            <p style={{ fontSize: '13px', color: 'var(--color-danger)', marginBottom: '8px' }}>{error}</p>
            <button className="btn-primary" style={{ fontSize: '13px', padding: '6px 14px' }} onClick={() => birthday && fetchBasicAI(birthday)}>다시 시도</button>
          </div>
        ) : result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
            {result.keywords.map((kw, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '16px' }}>•</span>
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)' }}>{kw}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* 인생 키워드 */}
      <div className="card" style={{ marginBottom: '12px' }}>
        <h3 className="section-title">✨ 인생 키워드</h3>
        {basicAILoading ? (
          <p className="text-caption" style={{ marginTop: '8px' }}>분석 중...</p>
        ) : result ? (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
            {result.lifeKeywords.map((kw, i) => (
              <span key={i} style={{
                padding: '6px 14px', borderRadius: '20px',
                background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                fontSize: '14px', fontWeight: 600,
              }}>{kw}</span>
            ))}
          </div>
        ) : null}
      </div>

      {/* AI 발견 특징 */}
      <div className="card" style={{ marginBottom: '12px', overflow: 'hidden', position: 'relative' }}>
        <h3 className="section-title">🤖 AI가 발견한 당신의 사주 특징</h3>
        {basicAILoading ? (
          <p className="text-caption">분석 중...</p>
        ) : result ? (
          <>
            <p className="text-body" style={{ lineHeight: 1.8 }}>{result.teaser}</p>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '48px', background: 'linear-gradient(transparent, var(--bg-card))' }} />
          </>
        ) : null}
      </div>

      {/* 맞춤 분석 카드 */}
      {birthday && (
        <div className="card" style={{ marginBottom: '12px' }}>
          <h3 className="section-title" style={{ marginBottom: '12px' }}>📍 지금 나에게 딱 맞는 이야기</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {getPersonalizedInsights(birthday.year, birthday.month, birthday.hour).map((insight, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', gap: '12px', alignItems: 'flex-start',
                  padding: '12px 14px', borderRadius: '12px',
                  background: i === 0 ? 'var(--color-primary-light)' : 'var(--color-bg)',
                  border: i === 0 ? '1px solid var(--color-primary-border)' : '1px solid var(--color-divider)',
                }}
              >
                <span style={{ fontSize: '20px', flexShrink: 0, lineHeight: 1.3 }}>{insight.icon}</span>
                <div>
                  <p style={{
                    fontSize: '11px', fontWeight: 700,
                    color: i === 0 ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    marginBottom: '4px',
                  }}>{insight.label}</p>
                  <p style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.65, margin: 0 }}>
                    {insight.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 유료 섹션 카드 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
        {DETAIL_SECTIONS.map((sec, i) => {
          const text = detailedResult?.[sec.key as keyof SajuResult] as string | undefined;
          const unlocked = isPurchased && !!text;
          const showPreview = !isPurchased && sec.key === 'wealth';
          return (
            <div key={sec.key} className="card animate-fade-in" style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'backwards' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: (unlocked || showPreview) ? '10px' : '0' }}>
                <span style={{ fontSize: '18px' }}>{sec.icon}</span>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>{sec.title}</h4>
                {!unlocked && <span style={{ marginLeft: 'auto', fontSize: '18px' }}>🔒</span>}
              </div>
              {unlocked && <p className="text-body" style={{ lineHeight: 1.8 }}>{text}</p>}
              {showPreview && result?.wealthPreview && (
                <div style={{ position: 'relative', overflow: 'hidden', maxHeight: '72px' }}>
                  <p className="text-body" style={{ lineHeight: 1.8 }}>{result.wealthPreview}</p>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '48px', background: 'linear-gradient(transparent, var(--bg-card))' }} />
                </div>
              )}
            </div>
          );
        })}

        {/* 결제 / 상태 영역 */}
        {isPurchased ? (
          detailedError ? (
            <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
              <p style={{ fontSize: '13px', color: 'var(--color-danger)', marginBottom: '8px' }}>{detailedError}</p>
              <button className="btn-primary" onClick={() => birthday && birthdayKey && fetchDetailed(birthdayKey, birthday)}>다시 시도</button>
            </div>
          ) : null
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '28px 20px', background: 'var(--color-primary-light)' }}>
            <p style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text)', lineHeight: 1.6 }}>
              AI가 당신의 사주에서 발견한<br />8가지 중요한 운세가 있습니다
            </p>
            <p className="text-caption" style={{ marginBottom: '20px' }}>일회성 결제 · 언제든 다시 확인 가능</p>
            {typeof (window as any).ReactNativeWebView === 'undefined' ? (
              <button className="btn-primary" onClick={handlePurchaseSuccess}>
                내 인생 사주 풀어보기
              </button>
            ) : (
              <PaymentButton
                sku="ait.0000021209.6f7520d0.e123db32c3.3252096438"
                label="내 인생 사주 풀어보기 · 2,200원"
                onSuccess={handlePurchaseSuccess}
              />
            )}
            {detailedError && (
              <div style={{ marginTop: '12px' }}>
                <p style={{ fontSize: '13px', color: 'var(--color-danger)', marginBottom: '8px' }}>{detailedError}</p>
                <button className="btn-primary" onClick={() => birthday && birthdayKey && fetchDetailed(birthdayKey, birthday)}>다시 시도</button>
              </div>
            )}
          </div>
        )}
      </div>


      {/* 이전에 결제한 사주 목록 */}
      {previousRecords.length > 0 && (
        <div className="card" style={{ marginBottom: '12px' }}>
          <h3 className="section-title">📂 이전에 분석한 사주</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {previousRecords.map(record => {
              const isExpanded = expandedPrevKey === record.birthdayKey;
              const hasCachedDetail = !!loadCache(`saju_detail_${record.birthdayKey}`);
              return (
                <div key={record.birthdayKey}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: 'var(--color-bg)', borderRadius: '10px',
                  }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>{record.label}</p>
                      <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        {new Date(record.date).toLocaleDateString('ko-KR')} 분석 완료
                      </p>
                    </div>
                    {hasCachedDetail && (
                      <button
                        onClick={() => setExpandedPrevKey(isExpanded ? null : record.birthdayKey)}
                        style={{
                          fontSize: '13px', fontWeight: 600,
                          color: 'var(--color-primary)', background: 'var(--color-primary-light)',
                          border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer',
                        }}
                      >
                        {isExpanded ? '닫기' : '보기'}
                      </button>
                    )}
                  </div>
                  {isExpanded && (
                    <PreviousAnalysisCard record={record} onClose={() => setExpandedPrevKey(null)} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {result && (
        <ShareCard
          title="사주 분석"
          message={detailedResult ? [
            `🔑 핵심 키워드: ${result.keywords.join(' · ')}`,
            result.lifeKeywords?.length ? `✨ 인생 키워드: ${result.lifeKeywords.join(' ')}` : '',
            detailedResult.wealth        ? `💰 재물운:\n${detailedResult.wealth}` : '',
            detailedResult.marriage      ? `💕 연애/결혼:\n${detailedResult.marriage}` : '',
            detailedResult.yearlyFortune ? `📅 올해 운세:\n${detailedResult.yearlyFortune}` : '',
            detailedResult.career        ? `💼 직업운:\n${detailedResult.career}` : '',
            detailedResult.relationship  ? `🤝 인간관계:\n${detailedResult.relationship}` : '',
            detailedResult.health        ? `💪 건강운:\n${detailedResult.health}` : '',
            detailedResult.luckyInfo     ? `🍀 행운 정보:\n${detailedResult.luckyInfo}` : '',
            detailedResult.lifeFlow      ? `🌊 인생 흐름:\n${detailedResult.lifeFlow}` : '',
          ].filter(Boolean).join('\n\n') : [
            `🔑 핵심 키워드: ${result.keywords.join(' · ')}`,
            result.lifeKeywords?.length ? `✨ 인생 키워드: ${result.lifeKeywords.join(' ')}` : '',
            `📖 사주 특징:\n${result.teaser}`,
            result.wealthPreview ? `💰 재물운 미리보기:\n${result.wealthPreview}` : '',
          ].filter(Boolean).join('\n\n')}
          type="사주 분석"
        />
      )}


    </div>
  );
}
