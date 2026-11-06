import { useEffect } from 'react';

/** 화면 아래에 잠깐 떠 있다가 사라지는 알림 (SAV-4) */
export default function Toast({ toast, onDone }) {
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [toast, onDone]);

  if (!toast) return null;
  return (
    <div className={`toast ${toast.type === 'error' ? 'toast-error' : ''}`} role="status">
      {toast.text}
    </div>
  );
}
