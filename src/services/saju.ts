import { callDeepSeek } from './deepseek-client';
import { calculateSaju } from './saju-calculator';
import { generateSajuBasic } from './saju-basic-generator';
import { buildSajuDetailedPrompt } from '../prompts/saju';
import { getSajuFromCache, saveSajuToCache, bucketHour } from './db-saju';
import { toSolarDate } from '../utils/lunar-solar';

export interface SajuResult {
  fourPillars: {
    year:  { heavenly: string; earthly: string };
    month: { heavenly: string; earthly: string };
    day:   { heavenly: string; earthly: string };
    hour:  { heavenly: string; earthly: string };
  };
  fiveElements: { wood: number; fire: number; earth: number; metal: number; water: number };
  mainElement: string;
  // 무료 콘텐츠 (로컬 규칙 기반)
  keywords: string[];
  lifeKeywords: string[];
  teaser: string;
  wealthPreview: string;
  // 유료 콘텐츠 (AI)
  wealth?: string;
  marriage?: string;
  yearlyFortune?: string;
  career?: string;
  relationship?: string;
  health?: string;
  luckyInfo?: string;
  lifeFlow?: string;
}

export async function getSaju(
  year: number,
  month: number,
  day: number,
  hour: number,
  gender: 'male' | 'female',
  isLunar: boolean,
  detailed: boolean,
): Promise<SajuResult> {
  // 1. 음력 → 양력 변환
  const solar = toSolarDate(year, month, day, isLunar);
  // 유료 상세는 6시간 버킷 시간으로 통일 (캐시 공유 및 AI 계산 일관성)
  const canonHour = detailed ? bucketHour(hour) : hour;
  const pillars = calculateSaju(solar.year, solar.month, solar.day, canonHour);

  // 2. 무료 기본 분석: 로컬 규칙 기반 (즉시)
  const basic = generateSajuBasic(pillars, gender);

  const baseResult: SajuResult = {
    fourPillars:   pillars.fourPillars,
    fiveElements:  pillars.fiveElements,
    mainElement:   pillars.mainElement,
    keywords:      basic.keywords,
    lifeKeywords:  basic.lifeKeywords,
    teaser:        basic.teaser,
    wealthPreview: basic.wealthPreview,
  };

  // 무료 분석은 즉시 반환 (DB 불필요)
  if (!detailed) return baseResult;

  // 3. 유료 상세: 공유 캐시 확인 (양력 날짜 + 버킷 시간 기준)
  const cached = await getSajuFromCache(solar.year, solar.month, solar.day, canonHour, gender);
  if (cached) {
    return { ...baseResult, ...cached };
  }

  // 4. 캐시 없으면 DeepSeek 호출 (버킷 시간 기준 사주로 프롬프트 생성)
  const prompt = buildSajuDetailedPrompt(pillars, gender);
  const text = await callDeepSeek(prompt, 4096, {
    systemMessage: '한국 사주 전문가처럼 해석하세요.',
    temperature: 0.6,
  });
  const aiResult = JSON.parse(text);

  const result: SajuResult = {
    ...baseResult,
    wealth:        aiResult.wealth,
    marriage:      aiResult.marriage,
    yearlyFortune: aiResult.yearlyFortune,
    career:        aiResult.career,
    relationship:  aiResult.relationship,
    health:        aiResult.health,
    luckyInfo:     aiResult.luckyInfo,
    lifeFlow:      aiResult.lifeFlow,
  };

  // 5. 캐시 저장 (백그라운드, 버킷 시간 키로 저장)
  saveSajuToCache(solar.year, solar.month, solar.day, canonHour, gender, result).catch(console.warn);

  return result;
}
