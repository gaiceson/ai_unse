-- fortune_cache: anon 쓰기 허용 (공유 캐시 - PII 없음)
-- anon도 INSERT/UPDATE 가능해야 클라이언트에서 캐시 저장 가능

CREATE POLICY "anon_write_fortune_cache" ON fortune_cache
  FOR INSERT TO anon WITH CHECK (true);

-- upsert(ON CONFLICT UPDATE)를 위해 UPDATE도 허용
CREATE POLICY "anon_update_fortune_cache" ON fortune_cache
  FOR UPDATE TO anon USING (true) WITH CHECK (true);
