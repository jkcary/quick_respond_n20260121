/**
 * Global Layout with Bottom Tab Navigation
 * Provides consistent navigation across all pages
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useErrorStore } from '@/store/errorStore';
import { useI18n } from '@/i18n';
import { useTheme } from '@/hooks/useTheme';

// SVG Icons as components for clean code
const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const TestIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ErrorLogIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// Theme toggle icons
const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const AutoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface NavItem {
  path: string;
  labelKey: string;
  icon: React.FC<{ className?: string }>;
  badge?: number;
}

interface LayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, hideNav = false }) => {
  const location = useLocation();
  const { t } = useI18n();
  const { mode, theme, toggleTheme } = useTheme();
  const { getTotalErrorCount } = useErrorStore();

  const errorCount = getTotalErrorCount();

  const navItems: NavItem[] = [
    { path: '/', labelKey: 'nav.home', icon: HomeIcon },
    { path: '/test', labelKey: 'nav.test', icon: TestIcon },
    { path: '/error-log', labelKey: 'nav.review', icon: ErrorLogIcon, badge: errorCount },
    { path: '/settings', labelKey: 'nav.settings', icon: SettingsIcon },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const getThemeIcon = () => {
    if (mode === 'auto') return AutoIcon;
    return theme === 'dark' ? MoonIcon : SunIcon;
  };

  const getThemeLabel = () => {
    if (mode === 'auto') return t('theme.auto');
    return theme === 'dark' ? t('theme.dark') : t('theme.light');
  };

  const ThemeIcon = getThemeIcon();

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Theme Toggle - Fixed top right */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={getThemeLabel()}
        title={getThemeLabel()}
        className="fixed top-4 right-4 z-[60] p-2 rounded-full
                   bg-bg-secondary/90 backdrop-blur-sm border border-border-primary
                   text-text-secondary hover:text-accent hover:border-accent
                   transition-all duration-200 shadow-card"
      >
        <ThemeIcon className="w-5 h-5" />
      </button>

      {/* Main Content */}
      <main className={`flex-1 ${hideNav ? '' : 'pb-20'}`}>
        <div className="page-enter">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      {!hideNav && (
        <nav className="bottom-nav">
          <div className="max-w-lg sm:max-w-2xl lg:max-w-4xl mx-auto px-2">
            <div className="flex items-center justify-around py-2">
              {navItems.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={active ? 'nav-item-active' : 'nav-item'}
                  >
                    <div className="relative">
                      <Icon className="w-6 h-6" />
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px]
                                       flex items-center justify-center
                                       bg-error text-white text-xs font-bold
                                       rounded-full px-1">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-medium mt-0.5">
                      {t(item.labelKey)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
};

export default Layout;
