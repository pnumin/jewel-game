import { useCallback, useEffect, useState } from 'react';
import Modal from './Modal';
import { fetchRanking } from '../services/scores';

const MEDALS = ['🥇', '🥈', '🥉'];

function formatDate(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** RNK-1 ~ RNK-6: 점수 내림차순 상위 20개 */
export default function RankingModal({ userId, onClose }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setRows(null);
    setError(null);
    try {
      setRows(await fetchRanking(20));
    } catch (e) {
      setError(e.message || '랭킹을 불러오지 못했습니다.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <Modal title="🏆 점수 랭킹" onClose={onClose} className="ranking">
      {error ? (
        <div className="state">
          <p className="err">랭킹을 불러오지 못했습니다: {error}</p>
          <button onClick={load}>다시 시도</button>
        </div>
      ) : rows === null ? (
        <p className="state" role="status">불러오는 중...</p>
      ) : rows.length === 0 ? (
        <p className="state">아직 저장된 점수가 없어요</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>순위</th><th>닉네임</th><th>점수</th><th>저장 일시</th></tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={r.user_id === userId ? 'mine' : ''}>
                  <td>{MEDALS[i] || i + 1}</td>
                  <td className="nick">{r.nickname}</td>
                  <td className="num">{r.score.toLocaleString()}</td>
                  <td className="date">{formatDate(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
