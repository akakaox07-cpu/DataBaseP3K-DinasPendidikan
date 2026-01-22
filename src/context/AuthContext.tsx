import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { login as apiLogin } from '../services/api';

interface AuthContextType {
  isLoggedIn: boolean;
  username: string;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const saved = sessionStorage.getItem('adminLoggedIn');
    const savedUsername = sessionStorage.getItem('adminUsername');
    if (saved === 'true') {
      setIsLoggedIn(true);
      setUsername(savedUsername || 'admin');
    }
  }, []);

  const login = async (user: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiLogin(user, password);
      if (result.success) {
        setIsLoggedIn(true);
        setUsername(user);
        sessionStorage.setItem('adminLoggedIn', 'true');
        sessionStorage.setItem('adminUsername', user);
        return { success: true };
      }
      return { success: false, error: result.error || 'Login gagal' };
    } catch (e) {
      return { success: false, error: 'Terjadi kesalahan koneksi' };
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUsername('');
    sessionStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('adminUsername');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
