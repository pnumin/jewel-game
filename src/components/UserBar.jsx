import { avatarUrl, displayName } from '../auth/AuthProvider';

/** HDR-1: 프로필 사진 + 닉네임 + 로그아웃 */
export default function UserBar({ user, onLogout }) {
  const avatar = avatarUrl(user);
  return (
    <div className="userbar">
      {avatar
        ? <img className="avatar" src={avatar} alt="" referrerPolicy="no-referrer" />
        : <span className="avatar avatar-empty" aria-hidden="true">👤</span>}
      <span><b>{displayName(user)}</b> 님</span>
      <button className="small" onClick={onLogout}>로그아웃</button>
    </div>
  );
}
