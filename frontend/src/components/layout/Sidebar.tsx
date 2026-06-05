import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Server, 
  Activity, 
  Bell, 
  FileText, 
  Monitor, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { cn } from '@/utils/cn';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  {
    labelKey: 'nav.dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    labelKey: 'nav.servers',
    icon: Server,
    path: '/servers',
  },
  {
    labelKey: 'nav.metrics',
    icon: Activity,
    path: '/metrics',
  },
  {
    labelKey: 'nav.alerts',
    icon: Bell,
    path: '/alerts',
  },
  {
    labelKey: 'nav.logs',
    icon: FileText,
    path: '/logs',
  },
  {
    labelKey: 'nav.bigscreen',
    icon: Monitor,
    path: '/bigscreen',
  },
  {
    labelKey: 'nav.settings',
    icon: Settings,
    path: '/settings',
  },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-dark-800 border-r border-dark-600 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-dark-600">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">Monitor</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className={cn(
            'p-1.5 rounded-lg hover:bg-dark-600 text-muted-foreground hover:text-foreground transition-colors',
            collapsed && 'mx-auto'
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
                           location.pathname.startsWith(item.path + '/');

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                    isActive
                      ? 'bg-primary-500/10 text-primary-400'
                      : 'text-muted-foreground hover:bg-dark-600 hover:text-foreground'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 flex-shrink-0',
                      isActive ? 'text-primary-400' : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  />
                  {!collapsed && (
                    <span className="text-sm font-medium">{t(item.labelKey)}</span>
                  )}
                  {isActive && !collapsed && (
                    <div className="ml-auto w-1.5 h-1.5 bg-primary-400 rounded-full" />
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-dark-600">
        <button
          onClick={logout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-dark-600 hover:text-foreground transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">{t('common.logout')}</span>}
        </button>
      </div>
    </aside>
  );
}
