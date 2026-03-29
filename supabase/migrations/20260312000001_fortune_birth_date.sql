-- fortune_readings에 생년월일 컬럼 추가 + unique 제약 변경
-- 기존: (user_id, reading_date)
-- 변경: (user_id, birth_year, birth_month, birth_day, reading_date)

ALTER TABLE fortune_readings
  ADD COLUMN birth_year  SMALLINT,
  ADD COLUMN birth_month SMALLINT,
  ADD COLUMN birth_day   SMALLINT;

-- 기존 unique 제약 제거
ALTER TABLE fortune_readings
  DROP CONSTRAINT fortune_readings_user_id_reading_date_key;

-- 새 unique 제약 추가
ALTER TABLE fortune_readings
  ADD CONSTRAINT fortune_readings_user_birth_date_unique
  UNIQUE (user_id, birth_year, birth_month, birth_day, reading_date);

-- 기존 인덱스 교체
DROP INDEX IF EXISTS idx_fortune_user_date;
CREATE INDEX idx_fortune_user_date
  ON fortune_readings(user_id, birth_year, birth_month, birth_day, reading_date DESC);
