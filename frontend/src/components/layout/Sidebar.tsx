import { NavLink } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  Briefcase,
  LayoutDashboard,
  Search,
  Settings,
  UserRound,
  Users,
  type LucideIcon,
  FlaskConical
} from 'lucide-react';
import type { Role } from '../../types';
import { cn } from '../../utils/cn';
import { Logo } from './Logo';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}

const STUDENT_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Browse Projects', to: '/browse', icon: BookOpen },
  { label: 'My Projects', to: '/projects/my', icon: FlaskConical },
  { label: 'Mentors', to: '/mentors', icon: Users },
  { label: 'My Teams', to: '/teams', icon: Briefcase },
  { label: 'Search', to: '/search', icon: Search },
  { label: 'Notifications', to: '/notifications', icon: Bell }
];

const FACULTY_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Projects', to: '/projects', icon: BookOpen },
  { label: 'Mentorship Requests', to: '/mentorships', icon: Users },
  { label: 'Search', to: '/search', icon: Search },
  { label: 'Notifications', to: '/notifications', icon: Bell }
];

const ADMIN_NAV: NavItem[] = [
  { label: 'Overview', to: '/admin/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Users', to: '/admin/users', icon: UserRound },
  { label: 'Projects', to: '/admin/projects', icon: BookOpen },
  { label: 'Faculty', to: '/admin/faculty', icon: Briefcase },
  { label: 'Notifications', to: '/notifications', icon: Bell }
];

const BOTTOM_NAV: NavItem[] = [
  { label: 'Profile', to: '/profile', icon: UserRound, end: true },
  { label: 'Settings', to: '/settings', icon: Settings }
];

export function navItemsForRole(role: Role): NavItem[] {
  if (role === 'ADMIN') return ADMIN_NAV;
  if (role === 'FACULTY') return FACULTY_NAV;
  return STUDENT_NAV;
}

function NavRow({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center rounded-card-sm transition-all duration-200',
          collapsed ? 'justify-center gap-0 px-0 py-3' : 'gap-3 px-3 py-2.5',
          isActive
            ? 'bg-gradient-brand text-white shadow-glow-soft'
            : 'text-slate-500 hover:bg-slate-900/[0.04] hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-white'
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'pointer-events-none absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full transition-opacity',
              isActive ? 'bg-white/80 opacity-100' : 'opacity-0'
            )}
            aria-hidden="true"
          />
          <item.icon
            className={cn(
              'shrink-0 transition-transform duration-200 group-hover:scale-110',
              collapsed ? 'h-5 w-5' : 'h-[18px] w-[18px]'
            )}
            aria-hidden="true"
          />
          {!collapsed && <span className="truncate text-sm font-medium">{item.label}</span>}
          {isActive && !collapsed && (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/80" aria-hidden="true" />
          )}
        </>
      )}
    </NavLink>
  );
}

export function SidebarContent({ role, collapsed = false }: { role: Role; collapsed?: boolean }) {
  const groups: NavItem[][] = [navItemsForRole(role), BOTTOM_NAV];
  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex items-center border-b border-slate-200/70 py-4 dark:border-white/[0.06]', collapsed ? 'justify-center px-0' : 'px-5')}>
        <Logo to="/dashboard" compact={collapsed} />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4 scrollbar-thin" aria-label="Sidebar">
        {groups.map((group, i) => (
          <div key={i}>
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                {i === 0 ? 'Workspace' : 'Account'}
              </p>
            )}
            <ul className="space-y-1">
              {group.map((item) => (
                <li key={item.to}>
                  <NavRow item={item} collapsed={collapsed} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200/70 px-4 py-4 dark:border-white/[0.06]">
        {collapsed ? (
          <div
            className="grid h-9 w-9 place-items-center rounded-full bg-gradient-brand text-[10px] font-extrabold text-white tracking-[0.08em]"
            aria-label="INNOVASPHERE"
          >
            IS
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70 dark:bg-emerald-500" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                INNOVASPHERE · <span className="font-medium text-slate-600 dark:text-slate-400">Research platform</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}