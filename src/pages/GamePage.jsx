import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { displayName, useAuth } from '../auth/AuthProvider';
import { MAX_MOVES } from '../game/constants';
import { fetchMyBest, saveScore } from '../services/scores';
import GameBoard from '../components/GameBoard';
import Hud from '../components/Hud';
import UserBar from '../components/UserBar';
import GameOverModal from '../components/GameOverModal';
import RankingModal from '../components/RankingModal';
import Toast from '../components/Toast';

export default function GamePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const boardRef = useRef(null);

  const [game, setGame] = useState({ score: 0, moves: MAX_MOVES, busy: true, gameOver: false });
  const [myBest, setMyBest] = useState(0);
  const [saved, setSaved] = useState(false);       // SAV-3: 이 판을 저장했는지
  const [saving, setSaving] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchMyBest(user.id).then(setMyBest).catch(() => {});
  }, [user.id]);

  const canSave = game.score > 0 && !game.busy && !saved && !saving;

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await saveScore({ nickname: displayName(user), score: game.score });
      setSaved(true);
      setMyBest((b) => Math.max(b, game.score));   // SAV-5
      setToast({ text: '점수를 저장했습니다!' });
    } catch (e) {
      setToast({ type: 'error', text: `저장 실패: ${e.message}` });
    } finally {
      setSaving(false);
    }
  };

  const onNewGame = () => {
    if (game.busy) return;
    setSaved(false);
    boardRef.current?.newGame();
  };

  const onLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const clearToast = useCallback(() => setToast(null), []);

  return (
    <main className="page game-page">
      <UserBar user={user} onLogout={onLogout} />
      <h1 className="title">💎 보석 맞추기</h1>
      <Hud score={game.score} moves={game.moves} myBest={myBest} />

      <div className="wrap">
        <GameBoard ref={boardRef} onState={setGame} locked={showRanking || game.gameOver} />
      </div>

      <div className="btns">
        <button onClick={() => boardRef.current?.showHint()} disabled={game.busy || game.gameOver}>💡 힌트</button>
        <button onClick={onSave} disabled={!canSave}>
          {saving ? '저장 중...' : saved ? '저장 완료 ✓' : '💾 점수 저장'}
        </button>
        <button onClick={() => setShowRanking(true)}>🏆 점수 확인</button>
        <button className="main" onClick={onNewGame} disabled={game.busy}>새 게임</button>
      </div>
      <p className="help">
        이웃한 보석을 클릭하거나 드래그해서 바꾸세요. 같은 보석 3개 이상을 한 줄로 맞추거나 2×2 사각형으로 모으면 사라집니다.
        연쇄(콤보)가 일어나면 점수가 배로 올라갑니다!
      </p>

      {game.gameOver && (
        <GameOverModal
          score={game.score}
          canSave={canSave}
          saving={saving}
          saved={saved}
          onSave={onSave}
          onRanking={() => setShowRanking(true)}
          onRestart={onNewGame}
        />
      )}
      {showRanking && <RankingModal userId={user.id} onClose={() => setShowRanking(false)} />}
      <Toast toast={toast} onDone={clearToast} />
    </main>
  );
}
