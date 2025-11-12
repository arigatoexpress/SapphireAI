import React from 'react';
import { Box, Alert, Button, Container, Typography } from '@mui/material';
import { useTrading } from '../contexts/TradingContext';
import EnhancedMetrics from '../components/EnhancedMetrics';
import AgentActivityGrid from '../components/AgentActivityGrid';
import PortfolioChart from '../components/PortfolioChart';

const Dashboard: React.FC = () => {
  const { error, refreshData } = useTrading();

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
            '& .MuiAlert-message': { width: '100%' }
          }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={refreshData}
              sx={{ fontWeight: 600 }}
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

      {/* Enhanced Metrics Cards */}
      <EnhancedMetrics />

      {/* Portfolio Performance Chart */}
      <PortfolioChart />

      {/* Agent Activity Grid */}
      <AgentActivityGrid />

      {/* System Status Footer */}
      <Box
        sx={{
          mt: 4,
          p: 2,
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          💎 Sapphire Trading AI - System Online | Last Updated: {new Date().toLocaleTimeString()}
        </Typography>
      </Box>
    </Container>
  );
};

export default Dashboard;
