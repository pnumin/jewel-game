import { supabase } from '../lib/supabase';

/** SAV-2: 현재 판의 점수를 저장한다. user_id 는 DB 기본값 auth.uid() 로 채워진다. */
export async function saveScore({ nickname, score }) {
  const { error } = await supabase
    .from('scores')
    .insert({ nickname: nickname.slice(0, 30) || '플레이어', score });
  if (error) throw error;
}

/** RNK-2: 점수 내림차순(같은 점수는 먼저 저장한 순) 상위 limit 개 */
export async function fetchRanking(limit = 20) {
  const { data, error } = await supabase
    .from('scores')
    .select('id, user_id, nickname, score, created_at')
    .order('score', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data;
}

/** HDR-2: 내가 저장한 점수 중 최고 점수 (없으면 0) */
export async function fetchMyBest(userId) {
  const { data, error } = await supabase
    .from('scores')
    .select('score')
    .eq('user_id', userId)
    .order('score', { ascending: false })
    .limit(1);
  if (error) throw error;
  return data[0]?.score ?? 0;
}
