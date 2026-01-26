import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from '@/components/common';
import { Layout } from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import { TestPage } from '@/components/test';
import ErrorLogPage from '@/pages/ErrorLogPage';
import MasteredPage from '@/pages/MasteredPage';
import SettingsPage from '@/pages/SettingsPage';
import { I18nProvider } from '@/i18n';
import { ThemeProvider } from '@/hooks/useTheme';

function App() {
  return (
    <ThemeProvider>
      <I18nProvider defaultLocale="zh">
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/test" element={<TestPage />} />
              <Route path="/review" element={<Navigate to="/error-log" replace />} />
              <Route path="/error-log" element={<ErrorLogPage />} />
              <Route path="/mastered" element={<MasteredPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </Layout>
          <ToastContainer position="top-right" />
        </BrowserRouter>
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;
