import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import ReviewPage from '@/pages/ReviewPage';
import SettingsPage from '@/pages/SettingsPage';

function App() {
  const config = useAppStore((state) => state.config);

  // Redirect to settings if API key is not configured
  const isConfigured = config.apiKey.trim().length > 0;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route
            index
            element={
              isConfigured ? <HomePage /> : <Navigate to="/settings" replace />
            }
          />
          <Route path="review" element={<ReviewPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
