import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MasterLayout } from './layouts/MasterLayout';

// Core Pages
import { UnifiedDashboard } from './pages/UnifiedDashboard';
import { AgentLab } from './pages/AgentLab';
import { PortfolioPro } from './pages/PortfolioPro';
import { About } from './pages/About';

const App: React.FC = () => {
  return (
    <MasterLayout>
      <Routes>
        {/* Main Dashboard */}
        <Route path="/" element={<UnifiedDashboard />} />

        {/* Agents Page */}
        <Route path="/agents" element={<AgentLab />} />

        {/* Portfolio Page */}
        <Route path="/portfolio" element={<PortfolioPro />} />

        {/* About Page */}
        <Route path="/about" element={<About />} />

        {/* Fallback */}
        <Route path="*" element={<UnifiedDashboard />} />
      </Routes>
    </MasterLayout>
  );
};

export default App;

