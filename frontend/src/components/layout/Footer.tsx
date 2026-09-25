import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, LayoutDashboard, Rocket, Users } from 'lucide-react';
import { Logo } from './Logo';

const PRODUCT_LINKS = [
  { to: '/browse', label: 'Browse projects', icon: BookOpen },
  { to: '/mentors', label: 'Find mentors', icon: Users },
  { to: '/register', label: 'Create account', icon: Rocket }
];

const PLATFORM_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/login', label: 'Faculty login', icon: GraduationCap }
];

export function Footer() {
  return (
    <footer className="relative border-t border-slate-200/60 bg-white/60 backdrop-blur dark:border-white/[0.06] dark:bg-deep-950/60">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              A university research collaboration platform that connects students, teams and faculty through AI-powered
              project and mentor matching.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Product</h3>
            <ul className="mt-4 space-y-2.5">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-300"
                  >
                    <link.icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Platform</h3>
            <ul className="mt-4 space-y-2.5">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-300"
                  >
                    <link.icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-200/70 pt-6 sm:flex-row dark:border-white/[0.06]">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} INNOVASPHERE. University research collaboration platform.
          </p>
          <p className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ring-alive" aria-hidden="true" />
            All systems operational
          </p>
        </div>
      </div>
    </footer>
  );
}