-- ===========================================================================
-- 開発用の仮データ(seed)。`supabase start` / `db reset` 時に自動投入される。
-- 本番には反映しない。トーンは劇画調・大脱走オマージュ。
-- ===========================================================================

-- --- トンネル1: Tom137(にぎやかめ・進行中) ---
insert into rooms (id, slug, tunnel_name, admin_x_user_id, created_at) values
  ('11111111-1111-1111-1111-111111111111', 'demo3xk9qwrtabcde7mnp2', 'Tom137', 'x_1001', now() - interval '9 days');

insert into entries (room_id, x_handle, x_verified, x_user_id, bluesky_handle, bluesky_did, status, self_confirmed) values
  ('11111111-1111-1111-1111-111111111111', 'hancho',    true,  'x_1001', 'bsky.app',            'did:plc:hancho0001', 'migrated',     true),
  ('11111111-1111-1111-1111-111111111111', 'nakama_a',  true,  'x_1002', 'atproto.com',         'did:plc:nakamaa002', 'both',         true),
  ('11111111-1111-1111-1111-111111111111', 'nakama_b',  true,  'x_1003', null,                  null,                 'stayed',       true),
  ('11111111-1111-1111-1111-111111111111', 'mayoi_c',   false, null,     null,                  null,                 'not_migrated', false),
  ('11111111-1111-1111-1111-111111111111', 'mayoi_d',   false, null,     null,                  null,                 'not_migrated', false);

-- --- トンネル2: Dick042(掘りはじめ) ---
insert into rooms (id, slug, tunnel_name, admin_x_user_id, created_at) values
  ('22222222-2222-2222-2222-222222222222', 'demo8vzt5z3hjkl9rq4bcd', 'Dick042', 'x_2001', now() - interval '2 days');

insert into entries (room_id, x_handle, x_verified, x_user_id, bluesky_handle, bluesky_did, status, self_confirmed) values
  ('22222222-2222-2222-2222-222222222222', 'shinsho',   true,  'x_2001', 'shinsho.bsky.social', 'did:plc:shinsho001', 'both',         true),
  ('22222222-2222-2222-2222-222222222222', 'tonneler',  false, null,     null,                  null,                 'not_migrated', false),
  ('22222222-2222-2222-2222-222222222222', 'diggerman', false, null,     null,                  null,                 'not_migrated', false);

-- --- トンネル3: Harry301(掘っただけ・ほぼ未着手) ---
insert into rooms (id, slug, tunnel_name, admin_x_user_id, created_at) values
  ('33333333-3333-3333-3333-333333333333', 'demoq2w9e4r7t1yu8i0pas', 'Harry301', 'x_3001', now() - interval '5 hours');

insert into entries (room_id, x_handle, x_verified, x_user_id, bluesky_handle, bluesky_did, status, self_confirmed) values
  ('33333333-3333-3333-3333-333333333333', 'soloescape', true, 'x_3001', null, null, 'not_migrated', false);
