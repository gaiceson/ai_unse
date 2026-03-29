-- RLS for fortune_cache and user_readings (added in 20260312000003)

ALTER TABLE fortune_cache  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_readings  ENABLE ROW LEVEL SECURITY;

-- service_role: 전체 접근
CREATE POLICY "service_role_all" ON fortune_cache FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON user_readings FOR ALL TO service_role USING (true);

-- fortune_cache: 공유 캐시 — anon은 읽기만 허용 (쓰기는 서버만)
CREATE POLICY "anon_read_fortune_cache" ON fortune_cache
  FOR SELECT TO anon USING (true);

-- user_readings: anon은 자신의 device_id 기반 레코드만 접근
CREATE POLICY "anon_own_user_readings" ON user_readings
  FOR ALL TO anon
  USING (user_id = (
    SELECT id::text FROM users
    WHERE device_id = current_setting('request.headers', true)::json->>'x-device-id'
  ));
