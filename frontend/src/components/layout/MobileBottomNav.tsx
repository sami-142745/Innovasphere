import { NavLink } from 'react-router-dom';
import type { NavItem } from './Sidebar';
import { cn } from '../../utils/cn';

/** Fixed glass bottom navigation shown on mobile (< lg). */
export function MobileBottomNav({ items }: { items: NavItem[] }) {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/85 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur-2xl lg:hidden dark:border-white/10 dark:bg-deep-900/85"
    >
      <ul className="flex items-center justify-around">
        {items.slice(0, 5).map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-medium transition-all',
                  isActive
                    ? 'text-brand-600 dark:text-brand-300'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'grid h-7 w-12 place-items-center rounded-full transition-colors',
                      isActive && 'bg-brand-500/15 dark:bg-brand-500/20'
                    )}
                  >
                    <item.icon className={cn('h-[18px] w-[18px]', isActive && 'drop-shadow-[0_0_6px_rgb(109_94_245/0.5)]')} aria-hidden="true" />
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}