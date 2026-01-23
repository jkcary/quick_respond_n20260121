import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer, LanguageToggle } from '@/components/common';
import HomePage from '@/pages/HomePage';
import { TestPage } from '@/components/test';
import ErrorLogPage from '@/pages/ErrorLogPage';
import MasteredPage from '@/pages/MasteredPage';
import SettingsPage from '@/pages/SettingsPage';
import { I18nProvider } from '@/i18n';

function App() {
  return (
    <I18nProvider defaultLocale="zh">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/review" element={<Navigate to="/error-log" replace />} />
          <Route path="/error-log" element={<ErrorLogPage />} />
          <Route path="/mastered" element={<MasteredPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        <ToastContainer position="top-right" />
        <LanguageToggle />
      </BrowserRouter>
    </I18nProvider>
  );
}

export default App;
