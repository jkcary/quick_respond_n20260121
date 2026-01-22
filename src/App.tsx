import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from '@/components/common';
import HomePage from '@/pages/HomePage';
import { TestPage } from '@/components/test';
import ErrorLogPage from '@/pages/ErrorLogPage';
import MasteredPage from '@/pages/MasteredPage';
import SettingsPage from '@/pages/SettingsPage';

function App() {
  return (
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
    </BrowserRouter>
  );
}

export default App;
