import React from 'react';
import { useI18n } from '@/i18n';

export const LanguageToggle: React.FC = () => {
  const { locale, toggleLocale, t } = useI18n();
  const nextLabel = locale === 'zh' ? 'EN' : '中文';
  const title = locale === 'zh' ? t('language.toEnglish') : t('language.toChinese');

  return (
    <button
      type="button"
      onClick={toggleLocale}
      title={title}
      aria-label={t('language.toggle')}
      className="fixed top-4 right-4 z-[60] px-3 py-1.5 rounded-full border border-slate-700 bg-slate-900/80 text-slate-200 text-xs font-semibold hover:border-cyan-500 hover:text-cyan-300 transition"
    >
      {nextLabel}
    </button>
  );
};
