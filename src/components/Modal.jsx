import { useEffect, useRef } from 'react';

/** 공통 모달: 배경 클릭·Esc 로 닫기, 열릴 때 대화상자로 포커스 이동 (RNK-6, 접근성) */
export default function Modal({ title, onClose, children, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
    if (!onClose) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className={`modal ${className}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        {onClose && <button className="modal-close" onClick={onClose} aria-label="닫기">×</button>}
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}
