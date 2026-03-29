import { useState, useCallback } from 'react';

export interface BirthdayData {
  year: number;
  month: number;
  day: number;
  hour?: number;
  gender?: 'male' | 'female';
  isLunar?: boolean;
  loginSource?: 'toss' | 'manual';
}

function getLocalDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getStorageItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStorageItem(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function useBirthday() {
  const [birthday, setBirthdayState] = useState<BirthdayData | null>(
    () => getStorageItem<BirthdayData | null>('unse_lab_birthday', null),
  );

  const setBirthday = useCallback((data: BirthdayData) => {
    setStorageItem('unse_lab_birthday', data);
    setBirthdayState(data);
  }, []);

  const clearBirthday = useCallback(() => {
    localStorage.removeItem('unse_lab_birthday');
    setBirthdayState(null);
  }, []);

  return { birthday, setBirthday, clearBirthday, hasBirthday: birthday !== null };
}

export function useCachedResult(key: string) {
  const today = getLocalDateStr();

  const getCached = useCallback((): string | null => {
    const cached = getStorageItem<{ date: string; data: string } | null>(`cache_${key}`, null);
    if (cached && cached.date === today) return cached.data;
    return null;
  }, [key, today]);

  const setCache = useCallback((data: string) => {
    setStorageItem(`cache_${key}`, { date: today, data });
  }, [key, today]);

  return { getCached, setCache, today };
}

export function useFortuneHistory() {
  const [history, setHistoryState] = useState<Array<{ date: string; type: string; summary: string }>>(
    () => getStorageItem('unse_lab_history', []),
  );

  const addHistory = useCallback((entry: { type: string; summary: string }) => {
    const newEntry = { ...entry, date: new Date().toISOString() };
    const updated = [newEntry, ...history].slice(0, 50);
    setStorageItem('unse_lab_history', updated);
    setHistoryState(updated);
  }, [history]);

  const clearHistory = useCallback(() => {
    localStorage.removeItem('unse_lab_history');
    setHistoryState([]);
  }, []);

  return { history, addHistory, clearHistory };
}

export function useDailyLimit(key: string, maxCount: number) {
  const today = getLocalDateStr();

  const getCount = useCallback((): number => {
    const data = getStorageItem<{ date: string; count: number } | null>(`limit_${key}`, null);
    if (data && data.date === today) return data.count;
    return 0;
  }, [key, today]);

  const increment = useCallback(() => {
    const current = getCount();
    setStorageItem(`limit_${key}`, { date: today, count: current + 1 });
  }, [key, today, getCount]);

  const canUse = getCount() < maxCount;

  return { canUse, getCount, increment };
}
