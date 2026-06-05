import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, Bell, Sun, Moon, Search } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { cn } from '@/utils/cn';
import { Input } from '@/components/ui/input';

interface HeaderProps {
  onMenuClick: () => void;
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'nav.dashboard',
  '/servers': 'nav.servers',
  '/metrics': 'nav.metrics',
  '/alerts': 'nav.alerts',
  '/logs': 'nav.logs',
  '/bigscreen': 'nav.bigscreen',
  '/settings': 'nav.settings',
};

export default function Header({ onMenuClick }: HeaderProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  const getPageTitle = () => {
    const path = location.pathname;
    for (const [key, value] of Object.entries(pageTitles)) {
      if (path.startsWith(key)) {
        return t(value);
      }
    }
    return t('nav.dashboard');
  };

  return (
    <header className="h-16 bg-dark-800 border-b border-dark-600 flex items-center justify-between px-4 lg:px-6">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-dark-600 text-muted-foreground hover:text-foreground transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg font-semibold text-foreground">{getPageTitle()}</h1>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-dark-700 rounded-lg px-3 py-2 border border-dark-600 focus-within:border-primary-500 transition-colors">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('common.search') + '...'}
            className="bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none w-48"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-dark-600 text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg hover:bg-dark-600 text-muted-foreground hover:text-foreground transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-3 ml-2 pl-3 border-l border-dark-600">
          <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
            <span className="text-sm font-medium text-primary-400">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-foreground">{user?.username || 'User'}</p>
            <p className="text-xs text-muted-foreground">{user?.role?.name || 'Admin'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
