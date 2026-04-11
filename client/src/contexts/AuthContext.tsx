import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../lib/services';

interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { username: string; email: string; phone: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('vertex_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    authApi.getMe()
      .then((data: any) => setUser(data))
      .catch(() => {
        localStorage.removeItem('vertex_token');
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (email: string, password: string) => {
    const data: any = await authApi.login({ email, password });
    localStorage.setItem('vertex_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const signup = async (payload: { username: string; email: string; phone: string; password: string }) => {
    await authApi.signup(payload);
  };

  const logout = () => {
    localStorage.removeItem('vertex_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
