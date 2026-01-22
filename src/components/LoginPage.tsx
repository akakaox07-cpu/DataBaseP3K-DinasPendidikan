import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

export default function LoginPage({ onBack, onLoginSuccess }: LoginPageProps) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);
    if (result.success) {
      onLoginSuccess();
    } else {
      setError(result.error || 'Username atau password salah!');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-logo">muaracore</h1>
            <p>Masuk ke akun administrator</p>
          </div>

          {error && <div className="login-alert">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary btn-lg" 
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Memproses...' : 'Login'}
            </button>
          </form>

          <div className="login-footer">
            <button className="btn-link" onClick={onBack}>
              <ArrowLeft size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Kembali ke Form Verifikasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
