import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

/** 카카오 로그인이 끝나고 돌아온 주소의 오류 메시지를 읽는다. */
function readAuthError() {
  const params = new URLSearchParams(window.location.search + '&' + window.location.hash.slice(1));
  return params.get('error_description') || params.get('error') || null;
}

/** 주소창에 남은 ?code= 등 인증 파라미터를 정리한다 (LOG-4). */
function cleanAuthParams() {
  if (window.location.search || window.location.hash) {
    window.history.replaceState(null, '', window.location.pathname);
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(!!supabase);
  const [authError, setAuthError] = useState(() => readAuthError());

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setAuthError(error.message);
      setSession(data.session);
      setLoading(false);
      cleanAuthParams();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithKakao = useCallback(async () => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: `${window.location.origin}/game` },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ user: session?.user ?? null, loading, authError, signInWithKakao, signOut }),
    [session, loading, authError, signInWithKakao, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

/** AUT-5: 표시 이름 */
export function displayName(user) {
  const m = user?.user_metadata || {};
  return m.name || m.full_name || m.preferred_username || m.user_name || '플레이어';
}

export function avatarUrl(user) {
  const m = user?.user_metadata || {};
  return m.avatar_url || m.picture || null;
}
