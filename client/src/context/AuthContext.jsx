import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('kaagazsetu_token') || '');
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('kaagazsetu_user') || 'null');
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    api('/auth/me')
      .then((result) => {
        setUser(result.user || null);
        localStorage.setItem('kaagazsetu_user', JSON.stringify(result.user));
      })
      .catch(() => {
        setToken('');
        localStorage.removeItem('kaagazsetu_token');
        localStorage.removeItem('kaagazsetu_user');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (payload) => {
    const result = await api('/auth/login', { method: 'POST', body: payload });
    const nextToken = result.token;
    localStorage.setItem('kaagazsetu_token', nextToken);
    localStorage.setItem('kaagazsetu_user', JSON.stringify(result.user));
    setToken(nextToken);
    setUser(result.user);
    return result;
  };

  const register = async (payload) => {
    const result = await api('/auth/register', { method: 'POST', body: payload });
    const nextToken = result.token;
    localStorage.setItem('kaagazsetu_token', nextToken);
    localStorage.setItem('kaagazsetu_user', JSON.stringify(result.user));
    setToken(nextToken);
    setUser(result.user);
    return result;
  };

  const logout = () => {
    localStorage.removeItem('kaagazsetu_token');
    localStorage.removeItem('kaagazsetu_user');
    setToken('');
    setUser(null);
  };

  const value = useMemo(() => ({ token, user, loading, login, register, logout }), [token, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
