// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Lunar } from 'lunar-javascript';

export interface SolarDate {
  year: number;
  month: number;
  day: number;
}

/** 음력 → 양력 변환. 양력 입력 시 그대로 반환. */
export function toSolarDate(
  year: number,
  month: number,
  day: number,
  isLunar: boolean,
): SolarDate {
  if (!isLunar) return { year, month, day };
  try {
    const solar = Lunar.fromYmd(year, month, day).getSolar();
    return { year: solar.getYear(), month: solar.getMonth(), day: solar.getDay() };
  } catch {
    // 변환 실패 시 그대로 반환
    return { year, month, day };
  }
}
