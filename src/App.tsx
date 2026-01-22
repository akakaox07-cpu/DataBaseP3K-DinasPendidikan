import { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import VerificationForm from './components/VerificationForm';
import AdminPanel from './components/AdminPanel';
import LoginPage from './components/LoginPage';
import Footer from './components/Footer';
import { useAuth } from './context/AuthContext';
import { Lock, User, LogOut } from 'lucide-react';
import './App.css';

type PageType = 'form' | 'login' | 'dashboard';

function AppContent() {
  const { isLoggedIn, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageType>('form');

  // Jika logout, kembali ke form
  useEffect(() => {
    if (!isLoggedIn && currentPage === 'dashboard') {
      setCurrentPage('form');
    }
  }, [isLoggedIn, currentPage]);

  const handleLoginClick = () => {
    setCurrentPage('login');
  };

  const handleLoginSuccess = () => {
    setCurrentPage('dashboard');
  };

  const handleBackToForm = () => {
    setCurrentPage('form');
  };

  const handleLogout = () => {
    logout();
    setCurrentPage('form');
  };

  // Halaman Login (fullscreen)
  if (currentPage === 'login') {
    return (
      <LoginPage 
        onBack={handleBackToForm} 
        onLoginSuccess={handleLoginSuccess} 
      />
    );
  }

  // Halaman Dashboard (setelah login)
  if (currentPage === 'dashboard' && isLoggedIn) {
    return (
      <div className="container">
        <header className="header">
          <div className="header-inner">
            <div className="header-left">
              <h1 className="app-name">Muaracore</h1>
            </div>
            <div className="header-right">
              <div className="admin-badge show">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} strokeWidth={1.5} /> Admin
                </span>
                <button className="btn-logout" onClick={handleLogout}>
                  <LogOut size={14} strokeWidth={1.5} /> Logout
                </button>
              </div>
            </div>
          </div>
        </header>
        <AdminPanel />
        <Footer />
      </div>
    );
  }

  // Halaman Form Verifikasi (default/public)
  return (
    <div className="container">
      <header className="header">
        <div className="header-inner">
          <div className="header-left">
            <h1 className="app-name">Muaracore</h1>
          </div>
          <div className="header-right">
            <button className="btn-header-login" onClick={handleLoginClick} title="Login Admin">
              <Lock size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>
      <VerificationForm />
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
