import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, Typography } from '@mui/material';
import { TradingProvider } from './contexts/TradingContext';
import Navbar from './components/Navbar';
import AnimatedBackground from './components/AnimatedBackground';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Agents from './pages/Agents';
import Analytics from './pages/Analytics';
import MissionControl from './pages/MissionControl';
import Workflow from './pages/Workflow';
import { mobileTheme } from './theme/mobileOptimizedTheme';

// Using enhanced futuristic theme with optimal readability and contrast


function AppContent() {
  return (
    <Router>
      <AnimatedBackground />
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'transparent' }}>
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: { xs: 2, sm: 3 },
              overflow: 'auto',
              background: 'transparent',
            }}
          >
            <Routes>
              <Route path="/" element={<Analytics />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/mission-control" element={<MissionControl />} />
              <Route path="/workflow" element={<Workflow />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>

            {/* Professional System Footer */}
            <Box
              component="footer"
              sx={{
                mt: 'auto',
                py: { xs: 2, sm: 3 },
                px: { xs: 2, sm: 3 },
                borderTop: '1px solid rgba(0, 212, 170, 0.2)',
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(26, 26, 26, 0.8) 100%)',
                backdropFilter: 'blur(20px)',
                textAlign: 'center'
              }}
            >
              <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '1rem', sm: '1.2rem' },
                    background: 'linear-gradient(135deg, #00d4aa 0%, #00f5d4 50%, #8a2be2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1.5,
                    letterSpacing: '0.5px'
                  }}
                >
                  🤖 INSTITUTIONAL-GRADE AI TRADING
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.85)',
                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                    fontWeight: 500,
                    mb: 1.5,
                    lineHeight: 1.4
                  }}
                >
                  Multi-Agent Consensus Intelligence • Sub-2μs Latency • Enterprise Risk Management
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: { xs: '0.85rem', sm: '0.95rem' },
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  <span style={{ color: '#00d4aa' }}>⚡</span>
                  <strong style={{ color: '#00d4aa' }}>Sapphire AI</strong>
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>on</span>
                  <strong style={{ color: '#8a2be2' }}>Aster DEX</strong>
                  <span style={{ color: '#8a2be2' }}>🔷</span>
                </Typography>
              </Box>

              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.65)',
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  fontWeight: 400,
                  fontStyle: 'italic',
                  display: { xs: 'none', sm: 'block' },
                  letterSpacing: '0.3px'
                }}
              >
                Advanced Multi-Agent Coordination Protocol • Agent Network Signal Processing • Real-time Anomaly Detection
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider theme={mobileTheme}>
      <CssBaseline />
      <TradingProvider>
        <AppContent />
      </TradingProvider>
    </ThemeProvider>
  );
}

export default App;
