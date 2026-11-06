import { POINTS_PER_GEM, BIG_MATCH_BONUS, SQUARE_BONUS } from './constants';

/** 한 번의 제거로 얻는 점수 (SCO-1 ~ SCO-3) */
export function matchPoints(size, squares, combo) {
  const base = size * POINTS_PER_GEM * combo;
  const big = size >= 4 ? (size - 3) * BIG_MATCH_BONUS : 0;
  return base + big + squares * SQUARE_BONUS;
}
