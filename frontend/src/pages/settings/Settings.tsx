import { useState } from 'react';
import { Bell, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { Button, Card, CardContent, CardHeader, CardTitle } from '../../components/ui';
import { HeroBanner } from '../../components/shared/HeroBanner';
import { cn } from '../../utils/cn';

const PREFS_KEY = 'innovasphere.prefs';

interface NotificationPrefs {
  emailAlerts: boolean;
  inAppAlerts: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = { emailAlerts: true, inAppAlerts: true };

function readPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
    return {
      emailAlerts: typeof parsed.emailAlerts === 'boolean' ? parsed.emailAlerts : DEFAULT_PREFS.emailAlerts,
      inAppAlerts: typeof parsed.inAppAlerts === 'boolean' ? parsed.inAppAlerts : DEFAULT_PREFS.inAppAlerts
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function ToggleRow({
  label,
  description,
  checked,
  onChange
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
          checked ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
        )}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { success } = useToast();
  const [prefs, setPrefs] = useState<NotificationPrefs>(readPrefs);

  if (!user) return null;

  const isDark = theme === 'dark';

  const updatePref = (key: keyof NotificationPrefs, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const savePrefs = () => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    success('Preferences saved');
  };

  return (
    <div className="space-y-6">
      <HeroBanner eyebrow="Preferences" title="Settings" description="Manage your appearance, notifications and account" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Theme</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Currently using {isDark ? 'dark' : 'light'} mode.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
                {isDark ? 'Light' : 'Dark'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-slate-400" aria-hidden="true" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <ToggleRow
                label="Email alerts"
                description="Receive email when your projects or mentorship requests are updated."
                checked={prefs.emailAlerts}
                onChange={(value) => updatePref('emailAlerts', value)}
              />
              <ToggleRow
                label="In-app alerts"
                description="Show notification banners inside the workspace."
                checked={prefs.inAppAlerts}
                onChange={(value) => updatePref('inAppAlerts', value)}
              />
              <Button onClick={savePrefs}>Save preferences</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-slate-100 dark:divide-slate-800">
            <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Email</dt>
              <dd className="truncate text-sm text-slate-900 sm:col-span-2 dark:text-slate-100">{user.email}</dd>
            </div>
            <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Username</dt>
              <dd className="truncate text-sm text-slate-900 sm:col-span-2 dark:text-slate-100">@{user.username}</dd>
            </div>
          </dl>
          <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
            <Button variant="danger" onClick={logout}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </Button>
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              You will be signed out of INNOVASPHERE on this device.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}