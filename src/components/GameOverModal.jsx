import Modal from './Modal';

/** GAM-5: 게임 종료 — 최종 점수, 점수 저장, 점수 확인, 다시 하기 */
export default function GameOverModal({ score, canSave, saving, saved, onSave, onRanking, onRestart }) {
  return (
    <Modal title="게임 종료!" className="gameover">
      <p className="final">최종 점수 <b>{score}</b></p>
      <div className="btns">
        <button className="main" onClick={onSave} disabled={!canSave}>
          {saving ? '저장 중...' : saved ? '저장 완료 ✓' : '💾 점수 저장'}
        </button>
        <button onClick={onRanking}>🏆 점수 확인</button>
        <button onClick={onRestart}>다시 하기</button>
      </div>
    </Modal>
  );
}
