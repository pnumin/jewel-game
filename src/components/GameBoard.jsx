import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { GameEngine } from '../game/engine';

/**
 * Canvas 보드. 보드·애니메이션은 GameEngine(ref) 안에서 돌고,
 * 화면에 표시할 값만 onState 로 올려 보낸다.
 */
const GameBoard = forwardRef(function GameBoard({ onState, locked }, ref) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const onStateRef = useRef(onState);
  onStateRef.current = onState;

  useEffect(() => {
    const engine = new GameEngine(canvasRef.current, (s) => onStateRef.current(s));
    engineRef.current = engine;
    return () => engine.destroy();
  }, []);

  useEffect(() => {
    engineRef.current?.setLocked(locked);
  }, [locked]);

  useImperativeHandle(ref, () => ({
    newGame: () => engineRef.current?.newGame(),
    showHint: () => engineRef.current?.showHint(),
  }), []);

  return <canvas ref={canvasRef} className="board" aria-label="보석 게임 보드" />;
});

export default GameBoard;
