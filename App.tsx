
import React from 'react';
import { MemoryRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import StudioPage from './pages/StudioPage';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen text-black">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage isSignUp={true} />} />
          {/* Studio is now public. Auth gate is handled inside StudioPage after 3 prompts. */}
          <Route path="/studio" element={<StudioPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
