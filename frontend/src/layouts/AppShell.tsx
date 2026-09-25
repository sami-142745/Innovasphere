import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Topbar } from '../components/layout/Topbar';
import { SidebarContent, navItemsForRole } from '../components/layout/Sidebar';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';
import type { Role } from '../types';
import { cn } from '../utils/cn';

const SIDEBAR_KEY = 'innovasphere.sidebar';

export function AppShell({ role }: { role: Role }) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === '1');

  const toggleSidebar = () => {
    setCollapsed((v) => {
      localStorage.setItem(SIDEBAR_KEY, v ? '0' : '1');
      return !v;
    });
  };

  return (
    <div className="relative flex min-h-screen">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="blob blob-purple -top-32 left-1/4 h-96 w-96 opacity-25 dark:opacity-40" />
        <div className="blob blob-cyan -right-24 top-1/3 h-80 w-80 opacity-20 dark:opacity-30" />
      </div>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-slate-200/80 bg-white/85 backdrop-blur-2xl lg:flex dark:border-white/[0.07] dark:bg-deep-900/70',
          collapsed ? 'w-[76px]' : 'w-64'
        )}
      >
        <SidebarContent role={role} collapsed={collapsed} />
      </aside>

      <div className={cn('flex min-h-screen w-full flex-col', collapsed ? 'lg:pl-[76px]' : 'lg:pl-64')}>
        <Topbar onToggleSidebar={toggleSidebar} collapsed={collapsed} />
        <main className="relative mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-28 sm:px-6 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav (below lg) */}
      <MobileBottomNav items={navItemsForRole(role)} />
    </div>
  );
}