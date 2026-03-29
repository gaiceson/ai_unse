import { callDeepSeek } from './deepseek-client';
import { calculateSaju } from './saju-calculator';
import { buildCompatibilityPrompt, buildCompatibilityDetailPrompt } from '../prompts/compatibility';

export interface CompatBasicResult {
  overallScore: number;
  chemistryType: string;
  relationshipType: string;
  keywords: string[];
  strengthsPreview: string;
  loveChance: number;
  loveChancePreview: string;
}

export interface CompatDetailResult {
  categories: {
    love: { score: number; message: string };
    communication: { score: number; message: string };
    values: { score: number; message: string };
    lifestyle: { score: number; message: string };
  };
  loveChanceDetail: string;
  strengths: string;
  cautions: string;
  fightPattern: string;
  marriageCompat: string;
  moneyCompat: string;
  longevity: string;
  breakupRisk: string;
  futureOutlook: string;
  advice: string;
}

// 기존 호환용
export interface CompatResult extends CompatBasicResult, CompatDetailResult {}

export async function getCompatibilityBasic(
  person1: { year: number; month: number; day: number; name?: string },
  person2: { year: number; month: number; day: number; name?: string },
): Promise<CompatBasicResult> {
  const p1Pillars = calculateSaju(person1.year, person1.month, person1.day, 12);
  const p2Pillars = calculateSaju(person2.year, person2.month, person2.day, 12);
  const prompt = buildCompatibilityPrompt(person1, person2, p1Pillars, p2Pillars);
  const text = await callDeepSeek(prompt, 800);
  return JSON.parse(text);
}

export async function getCompatibilityDetail(
  person1: { year: number; month: number; day: number; name?: string },
  person2: { year: number; month: number; day: number; name?: string },
): Promise<CompatDetailResult> {
  const p1Pillars = calculateSaju(person1.year, person1.month, person1.day, 12);
  const p2Pillars = calculateSaju(person2.year, person2.month, person2.day, 12);
  const prompt = buildCompatibilityDetailPrompt(person1, person2, p1Pillars, p2Pillars);
  const text = await callDeepSeek(prompt, 3000);
  return JSON.parse(text);
}

// 기존 호환
export async function getCompatibility(
  person1: { year: number; month: number; day: number; name?: string },
  person2: { year: number; month: number; day: number; name?: string },
): Promise<CompatResult> {
  const basic = await getCompatibilityBasic(person1, person2);
  const detail = await getCompatibilityDetail(person1, person2);
  return { ...basic, ...detail };
}
