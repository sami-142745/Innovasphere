import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Moon, PanelLeftClose, PanelLeftOpen, Search, Sun, UserRound } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useUnreadCount } from '../../hooks/useUnreadCount';
import { Avatar } from '../ui/Avatar';
import { BellButton } from './BellButton';
import { titleCase } from '../../utils/format';
import { cn } from '../../utils/cn';

export function Topbar({ onToggleSidebar, collapsed }: { onToggleSidebar?: () => void; collapsed?: boolean }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { count } = useUnreadCount(30000);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200/70 bg-white/75 px-4 backdrop-blur-2xl sm:px-6 dark:border-white/[0.07] dark:bg-deep-950/70">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="glass-chip hidden h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:text-brand-600 lg:inline-flex dark:text-slate-300 dark:hover:text-brand-300"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" aria-hidden="true" /> : <PanelLeftClose className="h-4 w-4" aria-hidden="true" />}
          </button>
        )}

        <div className="flex items-center gap-3">
          <div className="text-sm font-extrabold lg:hidden dark:text-slate-200 uppercase tracking-[0.08em]">
            <span className="gradient-text">INNOVASPHERE</span>
          </div>
          <div className="hidden lg:block">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {titleCase(user.role)} Workspace
              <span className="hidden items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 xl:inline-flex dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ring-alive" aria-hidden="true" />
                LIVE
              </span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage your research projects &amp; mentorship</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/search')}
          className="glass-chip hidden h-9 items-center gap-2 rounded-xl px-3 text-sm text-slate-500 transition hover:border-brand-300 hover:text-slate-700 md:inline-flex lg:w-56 lg:justify-between dark:text-slate-400 dark:hover:border-brand-400/40 dark:hover:text-slate-200"
        >
          <span className="inline-flex items-center gap-2">
            <Search className="h-4 w-4" aria-hidden="true" />
            Search anything…
          </span>
          <kbd className="hidden rounded-md border border-slate-200 bg-white/60 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 lg:inline dark:border-white/10 dark:bg-white/5 dark:text-slate-500">
            ⌘K
          </kbd>
        </button>

        <BellButton count={count} onClick={() => navigate('/notifications')} />

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="glass-chip inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-300"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2 rounded-xl border border-transparent p-1 pr-2 transition hover:border-slate-200 dark:hover:border-white/10"
          >
            <Avatar name={user.fullName} />
            <span className="hidden text-left sm:block">
              <span className="block max-w-40 truncate text-sm font-medium text-slate-900 dark:text-slate-100">{user.fullName}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">{titleCase(user.role)}</span>
            </span>
            <ChevronDown className={cn('hidden h-4 w-4 text-slate-400 transition-transform sm:block', menuOpen && 'rotate-180')} aria-hidden="true" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                role="menu"
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="glass-panel absolute right-0 top-full z-30 mt-2 w-60 rounded-card-sm py-1.5"
              >
                <div className="border-b border-slate-100 px-4 py-3 dark:border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <Avatar name={user.fullName} size="lg" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{user.fullName}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                    </div>
                  </div>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-900/5 dark:text-slate-200 dark:hover:bg-white/[0.05]"
                  role="menuitem"
                >
                  <UserRound className="h-4 w-4" aria-hidden="true" /> Profile &amp; skills
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-900/5 dark:text-slate-200 dark:hover:bg-white/[0.05]"
                  role="menuitem"
                >
                  <Sun className="h-4 w-4" aria-hidden="true" /> Settings
                </Link>
                <div className="mx-3 my-1 border-t border-slate-100 dark:border-white/[0.06]" role="separator" />
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-4 py-2 text-sm text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                  role="menuitem"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

export function RoleBadge({ role }: { role: string }) {
  return <span className="text-xs font-medium text-brand-600 dark:text-brand-400">{titleCase(role)}</span>;
}

export default Topbar;