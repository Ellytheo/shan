import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spin } from 'antd';

/**
 * Allows only Admin-role users.
 * Authenticated non-admins are redirected to /wp-adman
 * (they can still use the panel, just without admin-only views).
 * Unauthenticated users are redirected to /sponge.
 */
export default function AdminRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FAF9F6',
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sponge" replace />;
  }

  if (user.role !== 'Admin') {
    return <Navigate to="/wp-adman" replace />;
  }

  return children;
}
