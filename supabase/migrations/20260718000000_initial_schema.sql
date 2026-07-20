-- ===========================================================================
-- X大脱出 (The Great X Escape) — 初期スキーマ
-- SPEC.md「データが持つべき情報」に対応。
--
-- アクセスはすべてサーバールート経由(service_role)を想定。
-- 各テーブルは RLS を有効化し、公開ポリシーは付与しない(= anon/authenticated
-- からは実質アクセス不可)。service_role は RLS をバイパスする。
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- ステータス4値(SPEC): 未移行 / 併用中 / 移行済み / 残留
--   not_migrated … 未移行(初期状態)
--   both          … 併用中(X・Blueskyを両方使用、Bluesky認証済み)
--   migrated      … 移行済み(Blueskyへ移行、Bluesky認証済み)
--   stayed        … 残留(「Xに残る」を本人が選択、Bluesky認証不要)
-- ---------------------------------------------------------------------------
create type entry_status as enum ('not_migrated', 'both', 'migrated', 'stayed');

-- ---------------------------------------------------------------------------
-- rooms(トンネル)
--   slug             … アクセスURL用の推測不能なランダム文字列(表示名とは無関係)
--   tunnel_name      … 表示用トンネル名(Tom/Dick/Harry + 乱数)。表示専用。
--   admin_x_user_id  … 作成者(所有者)の X user_id。不変=所有権の単一の真実。
--                      handle ではなく user_id で持つのは、所有権判定を entries の
--                      可変フラグに散らさず room 側に一本化するため。
-- ---------------------------------------------------------------------------
create table rooms (
  id              uuid        primary key default gen_random_uuid(),
  slug            text        not null unique,
  tunnel_name     text        not null,
  admin_x_user_id text        not null,
  created_at      timestamptz not null default now()
);

-- 所有権ルックアップ(getMyTunnels の `admin_x_user_id = ?`)用。
create index rooms_admin_x_user_id_idx on rooms (admin_x_user_id);

-- ---------------------------------------------------------------------------
-- entries(リストの各行)
--   1行 = 1つのXアカウント。作成者自身も1行として含まれる(所有権は rooms
--   .admin_x_user_id が持つので、ここに管理者フラグは持たない。作成者行かどうかは
--   x_user_id == rooms.admin_x_user_id で判定できる)。
--   x_user_id / bluesky_* は認証が済んだ場合のみ埋まる(それまで NULL)。
--   self_confirmed=true の行は管理者による上書き対象から除外(ロック)。
-- ---------------------------------------------------------------------------
create table entries (
  id             uuid         primary key default gen_random_uuid(),
  room_id        uuid         not null references rooms(id) on delete cascade,
  x_handle       text         not null,                 -- 手入力・自己申告(@なし正規化を想定)
  x_verified     boolean      not null default false,   -- X OAuth 済みか
  x_user_id      text,                                  -- X認証済みなら X 側 user_id
  bluesky_handle text,                                  -- Bluesky認証済みなら handle
  bluesky_did    text,                                  -- Bluesky認証済みなら DID
  status         entry_status not null default 'not_migrated',
  self_confirmed boolean      not null default false,   -- 本人が確定済み(編集ロック)
  created_at     timestamptz  not null default now(),
  updated_at     timestamptz  not null default now(),

  -- 脱獄(移行済み/併用中)は Bluesky 認証済み=DIDを持つはず。DBレベルでも整合を担保。
  -- (残留/未移行は Bluesky 不要なので制約しない)
  constraint entries_migrated_needs_bluesky
    check (status not in ('migrated', 'both') or bluesky_did is not null)
);

-- 同一ルーム内で同じXハンドルの重複行を禁止。正規化(小文字化)はアプリ側で行うが、
-- DB でも lower() で一意にして「正規化忘れの別経路」でも重複が入らないようにする。
create unique index entries_room_handle_unique on entries (room_id, lower(x_handle));

create index entries_room_id_idx on entries (room_id);

-- ---------------------------------------------------------------------------
-- updated_at 自動更新
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger entries_set_updated_at
  before update on entries
  for each row
  execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Bluesky OAuth ストア(bluesky-official-accounts から移植)
--   @atproto/oauth-client-node の stateStore / sessionStore 用。
-- ---------------------------------------------------------------------------
create table oauth_states (
  key        text        primary key,
  value      jsonb       not null,
  created_at timestamptz not null default now()
);

-- 中断された認証で残った古い state を刈る掃除クエリ(oauthClient の set 時 GC)用。
create index oauth_states_created_at_idx on oauth_states (created_at);

create table oauth_sessions (
  did        text        primary key,
  value      jsonb       not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS: 全テーブル有効化・公開ポリシーなし(サーバー service_role のみ)
-- ---------------------------------------------------------------------------
alter table rooms          enable row level security;
alter table entries        enable row level security;
alter table oauth_states   enable row level security;
alter table oauth_sessions enable row level security;

-- ---------------------------------------------------------------------------
-- 権限: サーバー(service_role)にのみテーブル操作権を付与。
-- anon / authenticated には付与しない(RLS 有効 + 無権限で二重に遮断)。
-- ---------------------------------------------------------------------------
grant all privileges on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
