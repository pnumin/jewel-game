import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export function Loading() {
  return <div className="loading" role="status">불러오는 중...</div>;
}

/** AUT-3: 로그인하지 않았으면 로그인 화면으로 보낸다. */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/" replace />;
  return children;
}
