import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, Moon, Rocket, Sun, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Logo } from './Logo';
import { ButtonLink } from '../ui/Button';
import { cn } from '../../utils/cn';

const NAV_LINKS = [
  { to: '/browse', label: 'Projects' },
  { to: '/mentors', label: 'Mentors' }
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/75 backdrop-blur-2xl dark:border-white/[0.06] dark:bg-deep-950/70">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent" aria-hidden="true" />
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6" aria-label="Main">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                    : 'text-slate-600 hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white'
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="glass-chip inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-300"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
          </button>

          {isAuthenticated ? (
            <ButtonLink to="/dashboard">Dashboard</ButtonLink>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <ButtonLink variant="ghost" to="/login">Log in</ButtonLink>
              <ButtonLink variant="gradient" to="/register">
                <Rocket className="h-4 w-4" aria-hidden="true" /> Get started
              </ButtonLink>
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="glass-chip inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 md:hidden dark:text-slate-300"
          >
            {open ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-200/60 md:hidden dark:border-white/[0.06]"
          >
            <div className="flex flex-col gap-1 px-4 pb-4 pt-3">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="focus-ring rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-900/5 dark:text-slate-200 dark:hover:bg-white/5"
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <ButtonLink fullWidth to="/dashboard" onClick={() => setOpen(false)}>
                  Dashboard
                </ButtonLink>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <ButtonLink variant="outline" fullWidth to="/login" onClick={() => setOpen(false)}>
                    Log in
                  </ButtonLink>
                  <ButtonLink variant="gradient" fullWidth to="/register" onClick={() => setOpen(false)}>
                    Get started
                  </ButtonLink>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}