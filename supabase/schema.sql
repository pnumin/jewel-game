-- 보석 맞추기: 점수 테이블 (PRD §7)
-- Supabase 대시보드 → SQL Editor 에 붙여 넣고 Run 하세요.

create table if not exists public.scores (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nickname   text not null check (char_length(nickname) between 1 and 30),
  score      integer not null check (score between 0 and 1000000),
  created_at timestamptz not null default now()
);

create index if not exists scores_rank_idx on public.scores (score desc, created_at asc);

alter table public.scores enable row level security;

-- 로그인한 사용자는 랭킹을 볼 수 있다
drop policy if exists "scores_select_authenticated" on public.scores;
create policy "scores_select_authenticated"
  on public.scores for select to authenticated using (true);

-- 자기 점수만 저장할 수 있다 (수정·삭제 정책 없음 = 불가)
drop policy if exists "scores_insert_own" on public.scores;
create policy "scores_insert_own"
  on public.scores for insert to authenticated with check (user_id = auth.uid());
