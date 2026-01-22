import { useAuth } from '../context/AuthContext';
import { LogOut, User, Shield } from 'lucide-react';

interface HeaderProps {
  onLoginClick: () => void;
}

export default function Header({ onLoginClick }: HeaderProps) {
  const { isLoggedIn, logout, username } = useAuth();

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-left">
          <div className="app-logo">📋</div>
          <div>
            <h1 className="app-name">PPPK Verifikasi</h1>
            <p className="app-tagline">Sistem Verifikasi Data Pegawai PPPK Paruh Waktu</p>
          </div>
        </div>
        <div className="header-right">
          {!isLoggedIn ? (
            <button className="btn-header-login" onClick={onLoginClick}>
              <Shield size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Login Admin
            </button>
          ) : (
            <div className="admin-badge show">
              <User size={16} />
              <span>{username || 'Admin'}</span>
              <button className="btn-logout" onClick={logout}>
                <LogOut size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
