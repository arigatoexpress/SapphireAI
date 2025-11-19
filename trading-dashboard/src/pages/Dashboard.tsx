import { Container, Box, Typography, Grid, Alert, Button } from "@mui/material";
import React from 'react';
import { useTrading } from '../contexts/TradingContext';
import StreamlinedHeader from '../components/StreamlinedHeader';
import LiveMetricsPanel from '../components/LiveMetricsPanel';
import AgentDashboard from '../components/AgentDashboard';
import MarketAnalysis from '../components/MarketAnalysis';
import LiveTrades from '../components/LiveTrades';
import MCPChat from '../components/MCPChat';

const Dashboard: React.FC = () => {
  const { error, refreshData } = useTrading();

  return (
    <Container maxWidth="xl" sx={{ py: 2 }} className="fade-in-up">
      {error && !error.includes('demo data') && (
        <Alert
          severity="warning"
          sx={{
            mb: 3,
            borderRadius: 2,
            backdropFilter: 'blur(10px)',
            background: 'rgba(255, 193, 7, 0.1)',
            border: '1px solid rgba(255, 193, 7, 0.2)',
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
              Backend Connection
            </Typography>
            <Typography variant="body2">
              {error.includes('backend not available')
                ? 'Connecting to trading system...'
                : error} - Click retry to refresh data.
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Streamlined Header - Single Section */}
      <StreamlinedHeader />

      {/* Main Layout: Primary Content + Side Panel */}
      <Grid container spacing={3}>
        {/* Primary Content Area */}
        <Grid item xs={12} md={9}>
          {/* Market Analysis */}
          <MarketAnalysis />

          {/* Live Trades */}
          <LiveTrades />

          {/* Unified Agent Dashboard */}
          <AgentDashboard />
        </Grid>

        {/* Side Panel */}
        <Grid item xs={12} md={3}>
          {/* Live Metrics Panel */}
          <LiveMetricsPanel />

          {/* MCP Chat - Real-time Agent Communication */}
          <Box sx={{ mt: 3 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 2,
                color: '#00ffff',
              }}
            >
              Agent Communication
            </Typography>
            <MCPChat />
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
