import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MasterLayout } from './layouts/MasterLayout';

// NEW WORLD
import NewMissionControl from './pages/NewMissionControl';
import { Performance } from './pages/Performance';
import { AgentLab } from './pages/AgentLab';
import { SystemMetrics } from './pages/SystemMetrics';

// NEW REBUILDS (First Principles)
import { TerminalPro } from './pages/TerminalPro';
import { SystemConfig } from './pages/SystemConfig';
import { PortfolioPro } from './pages/PortfolioPro';

// OLD WORLD (Restored where available)
import { Dashboard } from './pages/Dashboard';
// import { LiveTrading } from './pages/LiveTrading';
import { Agents } from './pages/Agents'; // Legacy Agents List
// import { Portfolio } from './pages/Portfolio';
// import { Configuration } from './pages/Configuration';
import { Analytics } from './pages/Analytics'; // Legacy Analytics
import { SystemArchitecture as Architecture } from './pages/SystemArchitecture';
import { DualityDashboard } from './pages/DualityDashboard';
import { useDashboardWebSocket } from './hooks/useWebSocket';

// Simplified Wrapper to inject Legacy Props if needed (mocked for now to ensure render)
const LegacyWrapper: React.FC<{ Component: React.FC<any> }> = ({ Component }) => {
  // Ideally we would wire up the new Context to these old components here
  // For now, we render them so they appear
  return <Component bots={[]} messages={[]} trades={[]} openPositions={[]} />;
};


const App: React.FC = () => {
  return (
    <MasterLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/mission-control" replace />} />

        {/* --- 🚀 THE NEW SUITE --- */}
        <Route path="/mission-control" element={<NewMissionControl />} />
        <Route path="/performance" element={<Performance />} />
        <Route path="/agents" element={<AgentLab />} />
        <Route path="/command" element={<SystemMetrics />} />

        {/* --- 💎 PREMIUM REBUILDS --- */}
        <Route path="/live" element={<TerminalPro />} />
        <Route path="/config" element={<SystemConfig />} />
        <Route path="/portfolio" element={<PortfolioPro />} />

        {/* --- 🏛️ LEGACY RESTORATION --- */}
        <Route path="/dashboard" element={<LegacyWrapper Component={DualityDashboard} />} />
        {/* <Route path="/live" element={<LegacyWrapper Component={LiveTrading} />} /> Rebuilding... */}
        {/* <Route path="/portfolio" element={<LegacyWrapper Component={Portfolio} />} /> Replaced */}
        {/* <Route path="/config" element={<LegacyWrapper Component={Configuration} />} /> Rebuilding... */}
        <Route path="/architecture" element={<LegacyWrapper Component={Architecture} />} />
        <Route path="/duality" element={<LegacyWrapper Component={DualityDashboard} />} />

        {/* Placeholder Fallback for About */}
        <Route path="/about" element={<div>About</div>} />
      </Routes>
    </MasterLayout>
  );
};

export default App;
