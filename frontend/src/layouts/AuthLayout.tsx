import { useAuth } from '../context/AuthContext';
import { StudentLayout } from './StudentLayout';
import { FacultyLayout } from './FacultyLayout';
import { AdminLayout } from './AdminLayout';

export function AuthLayout() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === 'ADMIN') return <AdminLayout />;
  if (user.role === 'FACULTY') return <FacultyLayout />;
  return <StudentLayout />;
}