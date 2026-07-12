import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

// ─────────────────────────────────────────────────────────────────────────────
// Storage key for non-sensitive user info (id, username, role, status).
// Real authentication lives in the HttpOnly JWT cookie set by the backend.
// ─────────────────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'sv_user';

function loadCachedUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveUser(user) {
  if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEY);
}

// ─────────────────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(loadCachedUser);
  const [isLoading, setLoading] = useState(false);
  const navigate                = useNavigate();

  // Listen for session-expired events fired by the axios interceptor
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      saveUser(null);
      navigate('/sponge', { replace: true });
    };
    window.addEventListener('sv:session-expired', onExpired);
    return () => window.removeEventListener('sv:session-expired', onExpired);
  }, [navigate]);

  // ── login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (username, password) => {
    setLoading(true);
    try {
      const res = await api.post('/login', { username, password });

      if (res.data.status !== 'success') {
        throw new Error(res.data.message || 'Login failed.');
      }

      const userData = {
        id:       res.data.user.id,
        username: res.data.user.username,
        role:     res.data.user.role,
        status:   res.data.user.status,
      };

      setUser(userData);
      saveUser(userData);
      return { ok: true };
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Unknown error. Try again.';
      return { ok: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await api.post('/logout');
    } catch {
      // Even if the server call fails, clear client state
    } finally {
      setUser(null);
      saveUser(null);
      navigate('/sponge', { replace: true });
    }
  }, [navigate]);

  const value = { user, isLoading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─────────────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export default AuthContext;
