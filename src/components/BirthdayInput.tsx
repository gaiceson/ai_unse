import { useState } from 'react';
import type { BirthdayData } from '../hooks/useStorage';

interface Props {
  onSubmit: (data: BirthdayData) => void;
  showTime?: boolean;
  showGender?: boolean;
  initialData?: BirthdayData | null;
}

export function BirthdayInput({ onSubmit, showTime = false, showGender = false, initialData }: Props) {
  const [year, setYear] = useState(initialData?.year?.toString() || '');
  const [month, setMonth] = useState(initialData?.month?.toString() || '');
  const [day, setDay] = useState(initialData?.day?.toString() || '');
  const [hour, setHour] = useState(initialData?.hour?.toString() || '');
  const [gender, setGender] = useState<'male' | 'female'>(initialData?.gender || 'male');
  const [isLunar, setIsLunar] = useState(initialData?.isLunar || false);

  const isValid = year.length === 4 && Number(month) >= 1 && Number(month) <= 12 && Number(day) >= 1 && Number(day) <= 31;

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit({
      year: Number(year),
      month: Number(month),
      day: Number(day),
      ...(showTime && hour ? { hour: Number(hour) } : {}),
      ...(showGender ? { gender } : {}),
      isLunar,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="number"
          placeholder="년 (예: 1995)"
          value={year}
          onChange={e => setYear(e.target.value)}
          className="input-field"
          style={{ flex: 2, textAlign: 'center' }}
          maxLength={4}
        />
        <input
          type="number"
          placeholder="월"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="input-field"
          style={{ flex: 1, textAlign: 'center' }}
          min={1}
          max={12}
        />
        <input
          type="number"
          placeholder="일"
          value={day}
          onChange={e => setDay(e.target.value)}
          className="input-field"
          style={{ flex: 1, textAlign: 'center' }}
          min={1}
          max={31}
        />
      </div>

      {showTime && (
        <div>
          <label className="text-caption" style={{ marginBottom: '8px', display: 'block' }}>
            태어난 시간 <span style={{ color: 'var(--color-text-secondary)' }}>(선택 · 더 정확한 사주 분석)</span>
          </label>
          <select
            value={hour}
            onChange={e => setHour(e.target.value)}
            className="input-field"
            style={{ textAlign: 'center', cursor: 'pointer' }}
          >
            <option value="">모름 / 선택 안 함</option>
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>
                {i}시 ({i === 0 ? '자정' : i < 12 ? `오전 ${i}시` : i === 12 ? '정오' : `오후 ${i - 12}시`})
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setIsLunar(false)}
          className={`chip ${!isLunar ? 'chip-active' : 'chip-inactive'}`}
          style={{ flex: 1 }}
        >
          양력
        </button>
        <button
          onClick={() => setIsLunar(true)}
          className={`chip ${isLunar ? 'chip-active' : 'chip-inactive'}`}
          style={{ flex: 1 }}
        >
          음력
        </button>
      </div>

      {showGender && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setGender('male')}
            className={`chip ${gender === 'male' ? 'chip-active' : 'chip-inactive'}`}
            style={{ flex: 1 }}
          >
            남성
          </button>
          <button
            onClick={() => setGender('female')}
            className={`chip ${gender === 'female' ? 'chip-active' : 'chip-inactive'}`}
            style={{ flex: 1 }}
          >
            여성
          </button>
        </div>
      )}

      <button className="btn-primary" onClick={handleSubmit} disabled={!isValid}>
        분석 시작
      </button>
    </div>
  );
}
