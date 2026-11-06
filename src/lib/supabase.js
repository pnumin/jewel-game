import { createClient } from '@supabase/supabase-js';

// 환경변수는 이 파일에서만 읽는다 (PRD §8).
// 로컬: .env.local / Vercel: Project → Settings → Environment Variables
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const configError =
  !url || !key
    ? 'Supabase 환경변수가 없습니다 (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY).'
    : null;

export const supabase = configError ? null : createClient(url, key);
