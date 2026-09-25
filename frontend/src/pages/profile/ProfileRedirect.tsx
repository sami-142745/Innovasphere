import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProfileRedirect() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === 'STUDENT') return <Navigate to="/student/profile" replace />;
  if (user.role === 'FACULTY') return <Navigate to="/faculty/profile" replace />;

  return <Navigate to="/admin/dashboard" replace />;
}