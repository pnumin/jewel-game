import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { Loading } from '../auth/ProtectedRoute';
import { configError } from '../lib/supabase';

function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#191919" d="M12 3C6.48 3 2 6.58 2 11c0 2.85 1.86 5.35 4.66 6.77l-.95 3.5c-.08.3.26.54.52.37l4.17-2.77c.53.07 1.06.11 1.6.11 5.52 0 10-3.58 10-8S17.52 3 12 3z" />
    </svg>
  );
}

/** LOG-1 ~ LOG-6 */
export default function LoginPage() {
  const { user, loading, authError, signInWithKakao } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  if (loading) return <Loading />;
  if (user) return <Navigate to="/game" replace />;

  const onLogin = async () => {
    setPending(true);
    setError(null);
    try {
      await signInWithKakao();   // 성공하면 카카오 페이지로 이동한다
    } catch (e) {
      setError(e.message);
      setPending(false);
    }
  };

  const message = configError
    ? `설정 오류: ${configError}`
    : error || authError
      ? `로그인에 실패했습니다: ${error || authError}`
      : '';

  return (
    <main className="page login-page">
      <div className="login-card">
        <div className="logo" aria-hidden="true">💎</div>
        <h1>보석 맞추기</h1>
        <p>같은 보석 3개를 한 줄로, 또는 4개를 사각형으로 모아 보세요.<br />카카오 계정으로 로그인하면 게임을 시작할 수 있어요.</p>
        <button className="kakao" onClick={onLogin} disabled={pending || !!configError}>
          <KakaoIcon />
          {pending ? '로그인 중...' : '카카오 로그인'}
        </button>
        <p className="err" role="alert">{message}</p>
      </div>
    </main>
  );
}
