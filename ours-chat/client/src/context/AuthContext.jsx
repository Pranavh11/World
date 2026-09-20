import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { if (!localStorage.getItem('ours_token')) return setLoading(false); api('/auth/me').then(({ user: next }) => setUser(next)).catch(() => localStorage.removeItem('ours_token')).finally(() => setLoading(false)); }, []);
  async function login(credentials) { const data = await api('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }); localStorage.setItem('ours_token', data.token); setUser(data.user); }
  async function register(details) { const data = await api('/auth/register', { method: 'POST', body: JSON.stringify(details) }); localStorage.setItem('ours_token', data.token); setUser(data.user); }
  function logout() { localStorage.removeItem('ours_token'); setUser(null); }
  async function updateProfile(details) { const data = await api('/auth/me', { method: 'PATCH', body: JSON.stringify(details) }); setUser(data.user); }
  return <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
