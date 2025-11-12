import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TradingProvider } from './contexts/TradingContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Agents from './pages/Agents';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

// Dark theme optimized for trading dashboard
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00d4aa', // Sapphire green
    },
    secondary: {
      main: '#ff6b35', // Coral accent
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a',
    },
    success: {
      main: '#00d4aa',
    },
    error: {
      main: '#ff4444',
    },
    warning: {
      main: '#ffaa00',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(26,26,26,0.9) 0%, rgba(15,15,15,0.9) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0,212,170,0.1)',
        },
      },
    },
  },
});

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <div>Loading...</div>
      </Box>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
};

function AppContent() {
  const { user } = useAuth();

  return (
    <Router>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {user && <Navbar />}
        <Box component="main" sx={{ flexGrow: 1, py: user ? 3 : 0 }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portfolio"
              element={
                <ProtectedRoute>
                  <Portfolio />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agents"
              element={
                <ProtectedRoute>
                  <Agents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <TradingProvider>
          <AppContent />
        </TradingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
