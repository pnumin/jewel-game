/** HDR-2: 점수 · 남은 이동 · 내 최고 점수 */
export default function Hud({ score, moves, myBest }) {
  return (
    <div className="hud">
      <div className="box"><small>점수</small><b>{score}</b></div>
      <div className="box"><small>남은 이동</small><b>{moves}</b></div>
      <div className="box"><small>내 최고 점수</small><b>{myBest}</b></div>
    </div>
  );
}
