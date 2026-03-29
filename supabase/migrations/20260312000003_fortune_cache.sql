-- 공유 AI 캐시 테이블 (user_id 없음 - 사주 조합 기준으로 공유)
create table if not exists fortune_cache (
  id           uuid primary key default gen_random_uuid(),
  saju_key     text not null,
  fortune_type text not null check (fortune_type in ('basic', 'premium')),
  ai_result    jsonb not null,
  created_at   timestamptz default now()
);

-- saju_key + fortune_type 조합으로 유일하게 관리
create unique index if not exists idx_fortune_cache_key_type
  on fortune_cache (saju_key, fortune_type);

-- 사용자 조회 기록 테이블 (개인 기록 분리)
create table if not exists user_readings (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,
  saju_key     text not null,
  fortune_type text not null,
  viewed_at    timestamptz default now()
);

create index if not exists idx_user_readings_user
  on user_readings (user_id, fortune_type);
