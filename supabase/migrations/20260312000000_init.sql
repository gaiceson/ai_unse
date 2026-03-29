-- ============================================================
-- ai_unse (운세연구소) — Initial Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. users ────────────────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id     TEXT UNIQUE NOT NULL,
  toss_user_id  TEXT UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. user_profiles ────────────────────────────────────────
CREATE TABLE user_profiles (
  user_id     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  birth_year  SMALLINT NOT NULL CHECK (birth_year  BETWEEN 1900 AND 2100),
  birth_month SMALLINT NOT NULL CHECK (birth_month BETWEEN 1 AND 12),
  birth_day   SMALLINT NOT NULL CHECK (birth_day   BETWEEN 1 AND 31),
  birth_hour  SMALLINT         CHECK (birth_hour  BETWEEN 0 AND 23),
  gender      TEXT             CHECK (gender IN ('male','female')),
  is_lunar    BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. fortune_readings ─────────────────────────────────────
CREATE TABLE fortune_readings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reading_date    DATE NOT NULL,
  overall_score   SMALLINT NOT NULL CHECK (overall_score  BETWEEN 0 AND 100),
  overall_message TEXT NOT NULL,
  love_score      SMALLINT NOT NULL CHECK (love_score     BETWEEN 0 AND 100),
  love_message    TEXT NOT NULL,
  money_score     SMALLINT NOT NULL CHECK (money_score    BETWEEN 0 AND 100),
  money_message   TEXT NOT NULL,
  health_score    SMALLINT NOT NULL CHECK (health_score   BETWEEN 0 AND 100),
  health_message  TEXT NOT NULL,
  luck_score      SMALLINT NOT NULL CHECK (luck_score     BETWEEN 0 AND 100),
  luck_message    TEXT NOT NULL,
  detail          TEXT NOT NULL,
  lucky_item      TEXT NOT NULL,
  lucky_color     TEXT NOT NULL,
  lucky_number    SMALLINT NOT NULL,
  advice          TEXT NOT NULL,
  ai_model        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, reading_date)
);

-- ── 4. saju_readings ────────────────────────────────────────
CREATE TABLE saju_readings (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  birth_year     SMALLINT NOT NULL,
  birth_month    SMALLINT NOT NULL,
  birth_day      SMALLINT NOT NULL,
  birth_hour     SMALLINT NOT NULL,
  gender         TEXT NOT NULL CHECK (gender IN ('male','female')),
  is_lunar       BOOLEAN NOT NULL DEFAULT FALSE,
  is_detailed    BOOLEAN NOT NULL DEFAULT FALSE,
  four_pillars   JSONB NOT NULL,
  five_elements  JSONB NOT NULL,
  main_element   TEXT NOT NULL,
  keywords       TEXT[] NOT NULL,
  life_keywords  TEXT[] NOT NULL,
  teaser         TEXT NOT NULL,
  wealth_preview TEXT NOT NULL,
  wealth         TEXT,
  marriage       TEXT,
  yearly_fortune TEXT,
  career         TEXT,
  relationship   TEXT,
  health         TEXT,
  lucky_info     TEXT,
  life_flow      TEXT,
  payment_id     UUID,
  ai_model       TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. tarot_readings ───────────────────────────────────────
CREATE TABLE tarot_readings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question    TEXT NOT NULL,
  spread_type TEXT NOT NULL CHECK (spread_type IN ('single','three','celtic')),
  cards       JSONB NOT NULL,
  overall     TEXT NOT NULL,
  action      TEXT,
  caution     TEXT,
  timing      TEXT,
  advice      TEXT NOT NULL,
  key_message TEXT NOT NULL,
  ai_model    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 6. compat_readings ──────────────────────────────────────
CREATE TABLE compat_readings (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  p1_name             TEXT,
  p1_year             SMALLINT NOT NULL,
  p1_month            SMALLINT NOT NULL,
  p1_day              SMALLINT NOT NULL,
  p2_name             TEXT,
  p2_year             SMALLINT NOT NULL,
  p2_month            SMALLINT NOT NULL,
  p2_day              SMALLINT NOT NULL,
  overall_score       SMALLINT NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  chemistry_type      TEXT NOT NULL,
  relationship_type   TEXT NOT NULL,
  keywords            TEXT[] NOT NULL,
  strengths_preview   TEXT NOT NULL,
  love_chance         SMALLINT NOT NULL CHECK (love_chance BETWEEN 0 AND 100),
  love_chance_preview TEXT NOT NULL,
  categories          JSONB,
  love_chance_detail  TEXT,
  strengths           TEXT,
  cautions            TEXT,
  fight_pattern       TEXT,
  marriage_compat     TEXT,
  money_compat        TEXT,
  longevity           TEXT,
  breakup_risk        TEXT,
  future_outlook      TEXT,
  advice              TEXT,
  is_detailed         BOOLEAN NOT NULL DEFAULT FALSE,
  payment_id          UUID,
  ai_model            TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 7. consult_sessions ─────────────────────────────────────
CREATE TABLE consult_sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  birth_year  SMALLINT,
  birth_month SMALLINT,
  birth_day   SMALLINT,
  birth_hour  SMALLINT,
  gender      TEXT CHECK (gender IN ('male','female')),
  is_paid     BOOLEAN NOT NULL DEFAULT FALSE,
  payment_id  UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 8. consult_messages ─────────────────────────────────────
CREATE TABLE consult_messages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id    UUID NOT NULL REFERENCES consult_sessions(id) ON DELETE CASCADE,
  question      TEXT NOT NULL,
  free_answer   TEXT NOT NULL,
  paid_answer   TEXT,
  bullets       TEXT[],
  ai_model      TEXT,
  prompt_tokens  INT,
  output_tokens  INT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 9. payments ─────────────────────────────────────────────
CREATE TABLE payments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id     TEXT UNIQUE NOT NULL,
  sku          TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (
    service_type IN ('saju_detail','compat_detail','consult','tarot_premium')
  ),
  amount       INT,
  status       TEXT NOT NULL DEFAULT 'completed' CHECK (
    status IN ('pending','completed','refunded','failed')
  ),
  completed_at TIMESTAMPTZ,
  refunded_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 10. ai_request_logs ─────────────────────────────────────
CREATE TABLE ai_request_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  service_type  TEXT NOT NULL CHECK (
    service_type IN ('fortune','saju_basic','saju_detail','tarot','compat_basic','compat_detail','consult')
  ),
  reading_id    UUID,
  ai_model      TEXT NOT NULL,
  prompt_tokens  INT NOT NULL DEFAULT 0,
  output_tokens  INT NOT NULL DEFAULT 0,
  latency_ms     INT,
  is_cache_hit   BOOLEAN NOT NULL DEFAULT FALSE,
  error_message  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── FK (순환 참조 방지용 후처리) ─────────────────────────────
ALTER TABLE saju_readings
  ADD CONSTRAINT fk_saju_payment
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;

ALTER TABLE compat_readings
  ADD CONSTRAINT fk_compat_payment
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;

ALTER TABLE consult_sessions
  ADD CONSTRAINT fk_consult_payment
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;

-- ============================================================
-- 인덱스
-- ============================================================
CREATE INDEX idx_users_device_id          ON users(device_id);
CREATE INDEX idx_users_last_seen          ON users(last_seen_at DESC);

CREATE INDEX idx_fortune_user_date        ON fortune_readings(user_id, reading_date DESC);

CREATE INDEX idx_saju_user_created        ON saju_readings(user_id, created_at DESC);
CREATE INDEX idx_saju_input               ON saju_readings(birth_year, birth_month, birth_day, birth_hour, gender, is_detailed);

CREATE INDEX idx_tarot_user_created       ON tarot_readings(user_id, created_at DESC);

CREATE INDEX idx_compat_user_created      ON compat_readings(user_id, created_at DESC);
CREATE INDEX idx_compat_persons           ON compat_readings(p1_year, p1_month, p1_day, p2_year, p2_month, p2_day);

CREATE INDEX idx_consult_session_user     ON consult_sessions(user_id, created_at DESC);
CREATE INDEX idx_consult_messages_session ON consult_messages(session_id, created_at);

CREATE INDEX idx_payments_user_sku        ON payments(user_id, sku) WHERE status = 'completed';
CREATE INDEX idx_payments_order_id        ON payments(order_id);
CREATE INDEX idx_payments_user_service    ON payments(user_id, service_type) WHERE status = 'completed';

CREATE INDEX idx_ai_logs_service_date     ON ai_request_logs(service_type, created_at DESC);
CREATE INDEX idx_ai_logs_user_date        ON ai_request_logs(user_id, created_at DESC);

-- ============================================================
-- RLS (Row Level Security) — anon key로 직접 접근 차단
-- ============================================================
ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE fortune_readings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE saju_readings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarot_readings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE compat_readings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE consult_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE consult_messages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_request_logs   ENABLE ROW LEVEL SECURITY;

-- service_role(서버)은 전체 접근 허용
CREATE POLICY "service_role_all" ON users            FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON user_profiles    FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON fortune_readings FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON saju_readings    FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON tarot_readings   FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON compat_readings  FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON consult_sessions FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON consult_messages FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON payments         FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON ai_request_logs  FOR ALL TO service_role USING (true);

-- anon(프론트엔드)은 device_id 기반 자신의 데이터만 접근
-- users: device_id가 요청 헤더 x-device-id와 일치할 때
CREATE POLICY "anon_own_user" ON users
  FOR ALL TO anon
  USING (device_id = current_setting('request.headers', true)::json->>'x-device-id');

CREATE POLICY "anon_own_fortune" ON fortune_readings
  FOR ALL TO anon
  USING (user_id IN (
    SELECT id FROM users
    WHERE device_id = current_setting('request.headers', true)::json->>'x-device-id'
  ));

CREATE POLICY "anon_own_saju" ON saju_readings
  FOR ALL TO anon
  USING (user_id IN (
    SELECT id FROM users
    WHERE device_id = current_setting('request.headers', true)::json->>'x-device-id'
  ));

CREATE POLICY "anon_own_tarot" ON tarot_readings
  FOR ALL TO anon
  USING (user_id IN (
    SELECT id FROM users
    WHERE device_id = current_setting('request.headers', true)::json->>'x-device-id'
  ));

CREATE POLICY "anon_own_compat" ON compat_readings
  FOR ALL TO anon
  USING (user_id IN (
    SELECT id FROM users
    WHERE device_id = current_setting('request.headers', true)::json->>'x-device-id'
  ));

CREATE POLICY "anon_own_sessions" ON consult_sessions
  FOR ALL TO anon
  USING (user_id IN (
    SELECT id FROM users
    WHERE device_id = current_setting('request.headers', true)::json->>'x-device-id'
  ));

CREATE POLICY "anon_own_messages" ON consult_messages
  FOR ALL TO anon
  USING (session_id IN (
    SELECT cs.id FROM consult_sessions cs
    JOIN users u ON u.id = cs.user_id
    WHERE u.device_id = current_setting('request.headers', true)::json->>'x-device-id'
  ));

CREATE POLICY "anon_own_payments" ON payments
  FOR ALL TO anon
  USING (user_id IN (
    SELECT id FROM users
    WHERE device_id = current_setting('request.headers', true)::json->>'x-device-id'
  ));
