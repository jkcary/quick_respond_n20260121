import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { useI18n } from '@/i18n';

const Layout = () => {
  const location = useLocation();
  const errorCount = useAppStore((state) => state.errorLog.length);
  const { t } = useI18n();

  const navItems = [
    { path: '/', label: t('nav.diagnosis'), icon: 'D' },
    { path: '/error-log', label: t('nav.review'), icon: 'R', badge: errorCount },
    { path: '/settings', label: t('nav.settings'), icon: 'S' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-cyber-bg">
      {/* Header */}
      <header className="bg-cyber-surface border-b border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gradient-cyber">
              {t('app.name')}
            </h1>
            <div className="text-sm text-cyber-secondary">
              {t('app.poweredBy')}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-cyber-surface border-t border-slate-700 sticky bottom-0">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                    isActive
                      ? 'text-cyber-primary bg-cyber-primary/10'
                      : 'text-cyber-secondary hover:text-cyber-primary'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-xs font-medium relative">
                    {item.label}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1 -right-3 bg-cyber-alert text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
