// 사주팔자 로컬 계산 (만세력 기반)

const HEAVENLY = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const EARTHLY  = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

// 천간 오행: 갑을=목, 병정=화, 무기=토, 경신=금, 임계=수
const STEM_ELEMENT   = ['wood','wood','fire','fire','earth','earth','metal','metal','water','water'] as const;
// 지지 오행: 자=수, 축=토, 인=목, 묘=목, 진=토, 사=화, 오=화, 미=토, 신=금, 유=금, 술=토, 해=수
const BRANCH_ELEMENT = ['water','earth','wood','wood','earth','fire','fire','earth','metal','metal','earth','water'] as const;

type ElementKey = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
const EL_NAMES: Record<ElementKey, string> = {
  wood: '목(木)', fire: '화(火)', earth: '토(土)', metal: '금(金)', water: '수(水)',
};

export interface SajuPillars {
  fourPillars: {
    year:  { heavenly: string; earthly: string };
    month: { heavenly: string; earthly: string };
    day:   { heavenly: string; earthly: string };
    hour:  { heavenly: string; earthly: string };
  };
  fiveElements: { wood: number; fire: number; earth: number; metal: number; water: number };
  mainElement: string;
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** 율리우스 적일수 계산 */
function julianDay(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y
    + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

/** 사주팔자 + 오행 계산 */
export function calculateSaju(
  year: number,
  month: number,
  day: number,
  hour: number,
): SajuPillars {
  // ── 년주 ─────────────────────────────────────────
  const yearStem   = mod(year - 4, 10);
  const yearBranch = mod(year - 4, 12);

  // ── 월주 ─────────────────────────────────────────
  // 지지: 1월=축(1), 2월=인(2), ..., 12월=자(0)
  const monthBranch = mod(month + 1, 12);
  // 천간: 년간에 따른 인월(寅) 시작 천간
  // 甲己(0,5)→丙(2), 乙庚(1,6)→戊(4), 丙辛(2,7)→庚(6), 丁壬(3,8)→壬(8), 戊癸(4,9)→甲(0)
  const monthStemStarts = [2, 4, 6, 8, 0];
  const inOffset   = mod(monthBranch - 2, 12); // 인월(2)로부터의 월 수
  const monthStem  = mod(monthStemStarts[yearStem % 5] + inOffset, 10);

  // ── 일주 ─────────────────────────────────────────
  // 기준: 1900-01-01 = 庚子(천간6, 지지0)
  const JDN_REF  = julianDay(1900, 1, 1);
  const jdn      = julianDay(year, month, day);
  const dayDiff  = jdn - JDN_REF;
  const dayStem   = mod(6 + dayDiff, 10);
  const dayBranch = mod(0 + dayDiff, 12);

  // ── 시주 ─────────────────────────────────────────
  // 지지: 자(0)=0-1시, 축(1)=2-3시, 인(2)=4-5시 ...
  const hourBranch = mod(Math.floor((hour + 1) / 2), 12);
  // 甲己(0,5)→甲(0), 乙庚(1,6)→丙(2), 丙辛(2,7)→戊(4), 丁壬(3,8)→庚(6), 戊癸(4,9)→壬(8)
  const hourStemStarts = [0, 2, 4, 6, 8];
  const hourStem  = mod(hourStemStarts[dayStem % 5] + hourBranch, 10);

  // ── 오행 집계 (천간 4 + 지지 4) ───────────────────
  const fiveElements = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  const stems   = [yearStem, monthStem, dayStem, hourStem];
  const branches = [yearBranch, monthBranch, dayBranch, hourBranch];
  stems.forEach(s   => { fiveElements[STEM_ELEMENT[s]]++; });
  branches.forEach(b => { fiveElements[BRANCH_ELEMENT[b]]++; });

  const mainKey = (Object.keys(fiveElements) as ElementKey[])
    .reduce((a, b) => fiveElements[a] >= fiveElements[b] ? a : b);

  return {
    fourPillars: {
      year:  { heavenly: HEAVENLY[yearStem],  earthly: EARTHLY[yearBranch] },
      month: { heavenly: HEAVENLY[monthStem], earthly: EARTHLY[monthBranch] },
      day:   { heavenly: HEAVENLY[dayStem],   earthly: EARTHLY[dayBranch] },
      hour:  { heavenly: HEAVENLY[hourStem],  earthly: EARTHLY[hourBranch] },
    },
    fiveElements,
    mainElement: EL_NAMES[mainKey],
  };
}
