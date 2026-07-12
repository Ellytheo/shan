import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

// ─────────────────────────────────────────────────────────────────────────────
// Storage key for non-sensitive user info (id, username, role, status).
// Real authentication lives in the HttpOnly JWT cookie set by the backend.
// ─────────────────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'sv_user';

// Auto-logout after 2 hours of inactivity
const INACTIVITY_TIMEOUT_MS = 2 * 60 * 60 * 1000;

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
  const inactivityTimer         = useRef(null);

  // ── inactivity auto-logout ──────────────────────────────────────────────────
  const resetInactivityTimer = useCallback(() => {
    if (!user) return;
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      // Silently log out after 2 hours of no activity
      setUser(null);
      saveUser(null);
      navigate('/sponge', { replace: true });
    }, INACTIVITY_TIMEOUT_MS);
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, resetInactivityTimer));
    resetInactivityTimer(); // start the timer immediately on mount / user change
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetInactivityTimer));
      clearTimeout(inactivityTimer.current);
    };
  }, [user, resetInactivityTimer]);

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
    } finally {
      setLoading(false);
    }
  }, []);

  // ── logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    clearTimeout(inactivityTimer.current);
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
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export default AuthContext;
