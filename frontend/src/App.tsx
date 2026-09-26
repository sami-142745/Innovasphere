import { lazy, Suspense, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/error/ErrorBoundary';
import { AuthLayout } from './layouts/AuthLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { ProtectedRoute } from './components/routes/ProtectedRoute';
import { RoleRoute } from './components/routes/RoleRoute';
import { Loader2 } from 'lucide-react';

const Landing = lazy(() => import('./pages/Landing/Landing'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));

const ProjectDirectory = lazy(() => import('./pages/projects/Directory'));
const ProjectCreatePage = lazy(() => import('./pages/projects/Create'));
const ProjectEditPage = lazy(() => import('./pages/projects/Edit'));
const ProjectDetailPage = lazy(() => import('./pages/projects/Detail'));
const MyProjectsPage = lazy(() => import('./pages/projects/My'));

const MentorDirectory = lazy(() => import('./pages/mentors/Directory'));
const MentorDetailPage = lazy(() => import('./pages/mentors/Detail'));

const MyTeamsPage = lazy(() => import('./pages/teams/My'));
const TeamDetailPage = lazy(() => import('./pages/teams/Detail'));

const DashboardPage = lazy(() => import('./pages/Dashboard'));
const NotificationsPage = lazy(() => import('./pages/notifications/Notifications'));
const SearchPage = lazy(() => import('./pages/search/Search'));
const MentorshipRequestsPage = lazy(() => import('./pages/mentorships/MentorshipRequests'));

const ProfileRedirect = lazy(() => import('./pages/profile/ProfileRedirect'));
const StudentProfilePage = lazy(() => import('./pages/student/Profile'));
const FacultyProfilePage = lazy(() => import('./pages/faculty/Profile'));
const SettingsPage = lazy(() => import('./pages/settings/Settings'));

const AdminDashboardPage = lazy(() => import('./pages/admin/Dashboard'));
const AdminUsersPage = lazy(() => import('./pages/admin/Users'));
const AdminProjectsPage = lazy(() => import('./pages/admin/Projects'));
const AdminFacultyPage = lazy(() => import('./pages/admin/Faculty'));

const NotFoundPage = lazy(() => import('./pages/error/NotFound'));

// Preload function for the ProjectDirectory route
const preloadProjectDirectory = () => {
  import('./pages/projects/Directory');
};

function PageFallback() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-brand-600" aria-hidden="true" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

function NavigationPreloader() {
  const location = useLocation();
  const preloadTimeoutRef = useRef<number | null>(null);

  // Preload ProjectDirectory when hovering over any link to /browse or /projects
  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const href = e.currentTarget.getAttribute('href');
    if (href === '/browse' || href === '/projects' || href === '/mentors') {
      preloadTimeoutRef.current = window.setTimeout(() => {
        import('./pages/projects/Directory');
        import('./pages/mentors/Directory');
      }, 100);
    }
  };

  const handleMouseLeave = () => {
    if (preloadTimeoutRef.current) {
      clearTimeout(preloadTimeoutRef.current);
      preloadTimeoutRef.current = null;
    }
  };

  return (
    <>
      <a href="/browse" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} style={{ display: 'none' }} />
      <a href="/projects" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} style={{ display: 'none' }} />
      <a href="/mentors" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} style={{ display: 'none' }} />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageFallback />}>
        <NavigationPreloader />
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/browse" element={<ProjectDirectory />} />
            <Route path="/mentors" element={<MentorDirectory />} />
          </Route>

          <Route
            element={
              <ProtectedRoute>
                <AuthLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectDirectory />} />
            <Route path="/projects/my" element={<RoleRoute roles={['STUDENT']}><MyProjectsPage /></RoleRoute>} />
            <Route path="/projects/create" element={<RoleRoute roles={['STUDENT', 'FACULTY']}><ProjectCreatePage /></RoleRoute>} />
            <Route path="/projects/edit/:id" element={<RoleRoute roles={['STUDENT', 'FACULTY']}><ProjectEditPage /></RoleRoute>} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/mentors/:id" element={<MentorDetailPage />} />
            <Route path="/teams" element={<RoleRoute roles={['STUDENT']}><MyTeamsPage /></RoleRoute>} />
            <Route path="/teams/:id" element={<RoleRoute roles={['STUDENT']}><TeamDetailPage /></RoleRoute>} />
            <Route path="/mentorships" element={<RoleRoute roles={['FACULTY', 'ADMIN']}><MentorshipRequestsPage /></RoleRoute>} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/profile" element={<ProfileRedirect />} />
            <Route path="/student/profile" element={<RoleRoute roles={['STUDENT']}><StudentProfilePage /></RoleRoute>} />
            <Route path="/faculty/profile" element={<RoleRoute roles={['FACULTY']}><FacultyProfilePage /></RoleRoute>} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/admin/dashboard" element={<RoleRoute roles={['ADMIN']}><AdminDashboardPage /></RoleRoute>} />
            <Route path="/admin/users" element={<RoleRoute roles={['ADMIN']}><AdminUsersPage /></RoleRoute>} />
            <Route path="/admin/projects" element={<RoleRoute roles={['ADMIN']}><AdminProjectsPage /></RoleRoute>} />
            <Route path="/admin/faculty" element={<RoleRoute roles={['ADMIN']}><AdminFacultyPage /></RoleRoute>} />
          </Route>

          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}