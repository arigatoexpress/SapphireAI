import React from 'react';
import { Box, Alert, Button, Container, Typography } from '@mui/material';
import { useTrading } from '../contexts/TradingContext';
import EnhancedMetrics from '../components/EnhancedMetrics';
import AgentActivityGrid from '../components/AgentActivityGrid';
import PortfolioChart from '../components/PortfolioChart';

const Dashboard: React.FC = () => {
  const { error, refreshData } = useTrading();

  return (
    <Container maxWidth="xl" sx={{ py: 2 }} className="fade-in-up">
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
            backdropFilter: 'blur(10px)',
            background: 'rgba(255, 87, 87, 0.1)',
            border: '1px solid rgba(255, 87, 87, 0.2)',
            '& .MuiAlert-message': { width: '100%' }
          }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={refreshData}
              sx={{
                fontWeight: 600,
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              Retry
            </Button>
          }
        >
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
              Connection Error
            </Typography>
            <Typography variant="body2">
              {error} - Click retry to refresh data from the trading system.
            </Typography>
          </Box>
        </Alert>
      )}

      {/* System Overview */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h3"
          sx={{
            mb: 2,
            fontWeight: 800,
            background: 'linear-gradient(135deg, #00d4aa 0%, #8a2be2 50%, #00f5d4 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center',
            animation: 'float 6s ease-in-out infinite',
          }}
        >
          💎 Sapphire Trading Operations Center
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            maxWidth: '600px',
            mx: 'auto',
            lineHeight: 1.6,
            fontWeight: 400,
          }}
        >
          Enterprise-grade autonomous trading system with real-time monitoring,
          AI-driven decision making, and institutional-grade risk management.
        </Typography>
      </Box>

      {/* Key Performance Indicators */}
      <EnhancedMetrics />

      {/* Portfolio Performance */}
      <PortfolioChart />

      {/* AI Agent Activity */}
      <AgentActivityGrid />

      {/* System Status */}
      <Box
        sx={{
          mt: 4,
          p: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          System Status
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">Architecture</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>Kubernetes + GCP</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Uptime Target</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>99.9%</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">AI Agents</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>6 Active</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Last Updated</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{new Date().toLocaleTimeString()}</Typography>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Dashboard;
