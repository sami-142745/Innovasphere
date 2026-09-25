import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { Role } from '../../types';
import { ForbiddenPage } from '../../pages/error/Forbidden';

export function RoleRoute({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user, isInitializing } = useAuth();

  if (isInitializing) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
}