import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from '@/components/common';
import HomePage from '@/pages/HomePage';
import { TestPage } from '@/components/test';
import ReviewPage from '@/pages/ReviewPage';
import SettingsPage from '@/pages/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
      <ToastContainer position="top-right" />
    </BrowserRouter>
  );
}

export default App;
