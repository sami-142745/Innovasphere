import type { ReactNode } from 'react';
import { Sparkles, Users, GitMerge, ShieldCheck } from 'lucide-react';
import { Logo } from '../layout/Logo';
import { cn } from '../../utils/cn';

export interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

const PANEL_POINTS = [
  { icon: Sparkles, title: 'AI-powered matching', text: 'Get research project recommendations tailored to your skills and interests.' },
  { icon: Users, title: 'Build with faculty mentors', text: 'Team up with professors and peers on impactful, real-world research.' },
  { icon: GitMerge, title: 'Track every milestone', text: 'Manage memberships, join requests, and project progress in one place.' }
];

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-50 dark:bg-deep-950 lg:flex-row">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-40 dark:opacity-20" aria-hidden="true" />
      <div className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-gradient-brand opacity-15 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-accent-500 opacity-10 blur-3xl" aria-hidden="true" />

      <aside className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-deep-950 p-10 lg:flex xl:p-14">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="blob blob-brand absolute -left-24 top-[-10%] h-96 w-96" />
          <div className="blob blob-cyan absolute bottom-[-15%] left-1/3 h-80 w-80" />
          <div className="bg-grid absolute inset-0 opacity-30" />
        </div>
        <div className="relative">
          <Logo />
        </div>
        <div className="relative max-w-md">
          <span className="glass-chip mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-brand-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Research, together
          </span>
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
            Discover your next{' '}
            <span className="gradient-text">research adventure</span>.
          </h2>
          <ul className="mt-10 space-y-6">
            {PANEL_POINTS.map((point) => (
              <li key={point.title} className="flex items-start gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-brand text-white shadow-glow-soft">
                  <point.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{point.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-400">{point.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-accent-400" aria-hidden="true" />
          Trusted by students and faculty across campus
        </div>
      </aside>

      <div className="relative flex flex-1 flex-col">
        <header className="relative flex h-16 items-center justify-between px-5 sm:px-8 lg:h-20">
          <Logo className="lg:hidden" />
          <div className="ml-auto" />
        </header>
        <main className="relative flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-6 text-center">
              <h1 className="text-[26px] font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
            </div>
            <div
              className={cn(
                'relative overflow-hidden rounded-panel border border-white/60 bg-white/80 p-6 shadow-card backdrop-blur-xl sm:p-8',
                'dark:border-slate-800/80 dark:bg-deep-900/70'
              )}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent" aria-hidden="true" />
              {children}
            </div>
            {footer && <div className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">{footer}</div>}
          </div>
        </main>
        <footer className="relative border-t border-slate-200/80 py-5 text-center text-xs text-slate-400 dark:border-slate-800/60 dark:text-slate-500">
          INNOVASPHERE © {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}