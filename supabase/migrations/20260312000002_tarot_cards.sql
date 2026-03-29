-- ── tarot_cards 마스터 테이블 ────────────────────────────────
CREATE TABLE tarot_cards (
  id      SMALLINT PRIMARY KEY,
  name    TEXT NOT NULL,
  name_ko TEXT NOT NULL,
  arcana  TEXT NOT NULL CHECK (arcana IN ('major', 'minor')),
  suit    TEXT CHECK (suit IN ('wands', 'cups', 'swords', 'pentacles')),
  emoji   TEXT NOT NULL
);

-- anon 공개 읽기 허용 (카드 목록은 공개 데이터)
ALTER TABLE tarot_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read" ON tarot_cards FOR SELECT TO anon USING (true);
CREATE POLICY "service_role_all" ON tarot_cards FOR ALL TO service_role USING (true);

-- ── Major Arcana (22장) ──────────────────────────────────────
INSERT INTO tarot_cards (id, name, name_ko, arcana, suit, emoji) VALUES
(0,  'The Fool',             '바보',             'major', NULL, '🃏'),
(1,  'The Magician',         '마법사',           'major', NULL, '🎩'),
(2,  'The High Priestess',   '여사제',           'major', NULL, '🌙'),
(3,  'The Empress',          '여황제',           'major', NULL, '👑'),
(4,  'The Emperor',          '황제',             'major', NULL, '🏛️'),
(5,  'The Hierophant',       '교황',             'major', NULL, '⛪'),
(6,  'The Lovers',           '연인',             'major', NULL, '💕'),
(7,  'The Chariot',          '전차',             'major', NULL, '🏇'),
(8,  'Strength',             '힘',               'major', NULL, '🦁'),
(9,  'The Hermit',           '은둔자',           'major', NULL, '🏔️'),
(10, 'Wheel of Fortune',     '운명의 수레바퀴',  'major', NULL, '🎡'),
(11, 'Justice',              '정의',             'major', NULL, '⚖️'),
(12, 'The Hanged Man',       '매달린 사람',      'major', NULL, '🙃'),
(13, 'Death',                '죽음',             'major', NULL, '💀'),
(14, 'Temperance',           '절제',             'major', NULL, '⚗️'),
(15, 'The Devil',            '악마',             'major', NULL, '😈'),
(16, 'The Tower',            '탑',               'major', NULL, '🗼'),
(17, 'The Star',             '별',               'major', NULL, '⭐'),
(18, 'The Moon',             '달',               'major', NULL, '🌕'),
(19, 'The Sun',              '태양',             'major', NULL, '☀️'),
(20, 'Judgement',            '심판',             'major', NULL, '📯'),
(21, 'The World',            '세계',             'major', NULL, '🌍');

-- ── Minor Arcana — Wands (완드, id 22~35) ────────────────────
INSERT INTO tarot_cards (id, name, name_ko, arcana, suit, emoji) VALUES
(22, 'Ace of Wands',    '완드의 에이스', 'minor', 'wands', '🪄'),
(23, '2 of Wands',      '완드의 2',      'minor', 'wands', '🪄'),
(24, '3 of Wands',      '완드의 3',      'minor', 'wands', '🪄'),
(25, '4 of Wands',      '완드의 4',      'minor', 'wands', '🪄'),
(26, '5 of Wands',      '완드의 5',      'minor', 'wands', '🪄'),
(27, '6 of Wands',      '완드의 6',      'minor', 'wands', '🪄'),
(28, '7 of Wands',      '완드의 7',      'minor', 'wands', '🪄'),
(29, '8 of Wands',      '완드의 8',      'minor', 'wands', '🪄'),
(30, '9 of Wands',      '완드의 9',      'minor', 'wands', '🪄'),
(31, '10 of Wands',     '완드의 10',     'minor', 'wands', '🪄'),
(32, 'Page of Wands',   '완드의 페이지', 'minor', 'wands', '🪄'),
(33, 'Knight of Wands', '완드의 나이트', 'minor', 'wands', '🪄'),
(34, 'Queen of Wands',  '완드의 퀸',     'minor', 'wands', '🪄'),
(35, 'King of Wands',   '완드의 킹',     'minor', 'wands', '🪄');

-- ── Minor Arcana — Cups (컵, id 36~49) ───────────────────────
INSERT INTO tarot_cards (id, name, name_ko, arcana, suit, emoji) VALUES
(36, 'Ace of Cups',    '컵의 에이스', 'minor', 'cups', '🏆'),
(37, '2 of Cups',      '컵의 2',      'minor', 'cups', '🏆'),
(38, '3 of Cups',      '컵의 3',      'minor', 'cups', '🏆'),
(39, '4 of Cups',      '컵의 4',      'minor', 'cups', '🏆'),
(40, '5 of Cups',      '컵의 5',      'minor', 'cups', '🏆'),
(41, '6 of Cups',      '컵의 6',      'minor', 'cups', '🏆'),
(42, '7 of Cups',      '컵의 7',      'minor', 'cups', '🏆'),
(43, '8 of Cups',      '컵의 8',      'minor', 'cups', '🏆'),
(44, '9 of Cups',      '컵의 9',      'minor', 'cups', '🏆'),
(45, '10 of Cups',     '컵의 10',     'minor', 'cups', '🏆'),
(46, 'Page of Cups',   '컵의 페이지', 'minor', 'cups', '🏆'),
(47, 'Knight of Cups', '컵의 나이트', 'minor', 'cups', '🏆'),
(48, 'Queen of Cups',  '컵의 퀸',     'minor', 'cups', '🏆'),
(49, 'King of Cups',   '컵의 킹',     'minor', 'cups', '🏆');

-- ── Minor Arcana — Swords (소드, id 50~63) ───────────────────
INSERT INTO tarot_cards (id, name, name_ko, arcana, suit, emoji) VALUES
(50, 'Ace of Swords',    '소드의 에이스', 'minor', 'swords', '⚔️'),
(51, '2 of Swords',      '소드의 2',      'minor', 'swords', '⚔️'),
(52, '3 of Swords',      '소드의 3',      'minor', 'swords', '⚔️'),
(53, '4 of Swords',      '소드의 4',      'minor', 'swords', '⚔️'),
(54, '5 of Swords',      '소드의 5',      'minor', 'swords', '⚔️'),
(55, '6 of Swords',      '소드의 6',      'minor', 'swords', '⚔️'),
(56, '7 of Swords',      '소드의 7',      'minor', 'swords', '⚔️'),
(57, '8 of Swords',      '소드의 8',      'minor', 'swords', '⚔️'),
(58, '9 of Swords',      '소드의 9',      'minor', 'swords', '⚔️'),
(59, '10 of Swords',     '소드의 10',     'minor', 'swords', '⚔️'),
(60, 'Page of Swords',   '소드의 페이지', 'minor', 'swords', '⚔️'),
(61, 'Knight of Swords', '소드의 나이트', 'minor', 'swords', '⚔️'),
(62, 'Queen of Swords',  '소드의 퀸',     'minor', 'swords', '⚔️'),
(63, 'King of Swords',   '소드의 킹',     'minor', 'swords', '⚔️');

-- ── Minor Arcana — Pentacles (펜타클, id 64~77) ──────────────
INSERT INTO tarot_cards (id, name, name_ko, arcana, suit, emoji) VALUES
(64, 'Ace of Pentacles',    '펜타클의 에이스', 'minor', 'pentacles', '🪙'),
(65, '2 of Pentacles',      '펜타클의 2',      'minor', 'pentacles', '🪙'),
(66, '3 of Pentacles',      '펜타클의 3',      'minor', 'pentacles', '🪙'),
(67, '4 of Pentacles',      '펜타클의 4',      'minor', 'pentacles', '🪙'),
(68, '5 of Pentacles',      '펜타클의 5',      'minor', 'pentacles', '🪙'),
(69, '6 of Pentacles',      '펜타클의 6',      'minor', 'pentacles', '🪙'),
(70, '7 of Pentacles',      '펜타클의 7',      'minor', 'pentacles', '🪙'),
(71, '8 of Pentacles',      '펜타클의 8',      'minor', 'pentacles', '🪙'),
(72, '9 of Pentacles',      '펜타클의 9',      'minor', 'pentacles', '🪙'),
(73, '10 of Pentacles',     '펜타클의 10',     'minor', 'pentacles', '🪙'),
(74, 'Page of Pentacles',   '펜타클의 페이지', 'minor', 'pentacles', '🪙'),
(75, 'Knight of Pentacles', '펜타클의 나이트', 'minor', 'pentacles', '🪙'),
(76, 'Queen of Pentacles',  '펜타클의 퀸',     'minor', 'pentacles', '🪙'),
(77, 'King of Pentacles',   '펜타클의 킹',     'minor', 'pentacles', '🪙');
