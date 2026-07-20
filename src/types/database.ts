// このファイルは `npm run db:generate-types`(supabase gen types)で自動生成される
// プレースホルダ。ローカルの Supabase を起動してから再生成すること。
// 手書きの最小型で当面の型付けを担保する。

import type { Status } from "~/lib/status";

export type RoomRow = {
  id: string;
  slug: string;
  tunnel_name: string;
  admin_x_user_id: string;
  created_at: string;
};

export type EntryRow = {
  id: string;
  room_id: string;
  x_handle: string;
  x_verified: boolean;
  x_user_id: string | null;
  bluesky_handle: string | null;
  bluesky_did: string | null;
  status: Status;
  self_confirmed: boolean;
  created_at: string;
  updated_at: string;
};
