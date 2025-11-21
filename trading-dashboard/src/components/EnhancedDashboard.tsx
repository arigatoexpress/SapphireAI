import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Grid, Alert } from '@mui/material';
import TradingViewChart from './TradingViewChart';
import BotPerformanceComparison from './BotPerformanceComparison';
import BotPerformanceCards from './BotPerformanceCards';
import useDashboardWebSocket from '../hooks/useWebSocket';
import '../styles/dashboard.css';

const EnhancedDashboard: React.FC = () => {
  const { data, connected, error } = useDashboardWebSocket();
  const [marketData, setMarketData] = useState<any[]>([]);

  // Simulate market data for chart (replace with real data from API)
  useEffect(() => {
    // This would come from your backend API
    // For now, generating sample data
    const generateSampleData = () => {
      const now = Math.floor(Date.now() / 1000);
      return Array.from({ length: 100 }, (_, i) => ({
        time: now - (100 - i) * 60, // 1-minute candles
        open: 45000 + Math.random() * 1000,
        high: 45500 + Math.random() * 1000,
        low: 44500 + Math.random() * 1000,
        close: 45000 + Math.random() * 1000,
        volume: Math.random() * 1000000,
      }));
    };

    setMarketData(generateSampleData());
  }, []);

  // Transform WebSocket data for components
  const bots = data?.agents?.map(agent => ({
    id: agent.id,
    name: agent.name || agent.id,
    emoji: getAgentEmoji(agent.id),
    pnl: agent.pnl || 0,
    win_rate: agent.win_rate || 0.5,
    total_trades: agent.total_trades || 0,
    active_positions: agent.active_positions || 0,
    capital: 100, // From config
    roi: ((agent.pnl || 0) / 100) * 100,
    avg_trade_size: 20,
    best_trade: agent.best_trade || 0,
    worst_trade: agent.worst_trade || 0,
    sharpe_ratio: agent.sharpe_ratio || 0,
  })) || [];

  return (
    <Box className="dashboard-grid" sx={{ minHeight: '100vh', p: 2 }}>
      {/* Connection Status */}
      <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
        <div className={`status-dot ${connected ? 'connected' : 'disconnected'}`} />
        {connected ? '🟢 Live' : '🔴 Disconnected'}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ gridColumn: '1 / -1', mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Portfolio Overview - Top */}
      <Paper className="portfolio-section" elevation={0}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff', mb: 3 }}>
          💎 Portfolio Overview
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box className="metric-card">
              <Typography className="metric-label">Total P&L</Typography>
              <Typography className={`metric-value ${data?.total_pnl >= 0 ? 'positive' : 'negative'}`}>
                ${data?.total_pnl?.toFixed(2) || '0.00'}
              </Typography>
              <Typography className={`metric-change ${data?.total_pnl >= 0 ? 'positive' : 'negative'}`}>
                {data?.total_pnl >= 0 ? '↑' : '↓'} {Math.abs(data?.total_pnl || 0).toFixed(2)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box className="metric-card">
              <Typography className="metric-label">Portfolio Balance</Typography>
              <Typography className="metric-value">
                ${data?.portfolio_balance?.toFixed(2) || '600.00'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                6 bots × $100
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box className="metric-card">
              <Typography className="metric-label">Total Exposure</Typography>
              <Typography className="metric-value">
                ${data?.total_exposure?.toFixed(2) || '0.00'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                {data?.active_positions_count || 0} positions
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box className="metric-card">
              <Typography className="metric-label">Active Bots</Typography>
              <Typography className="metric-value">
                {bots.length}/6
              </Typography>
              <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                {data?.grok_overrides || 0} Grok overrides
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Chart - Center */}
      <Paper className="chart-section" elevation={0}>
        <Box className="chart-header">
          <Typography className="chart-title">
            📈 BTC/USDT - 1m
          </Typography>
          <Box className="chart-controls">
            <button className="timeframe-btn active">1m</button>
            <button className="timeframe-btn">5m</button>
            <button className="timeframe-btn">15m</button>
            <button className="timeframe-btn">1h</button>
            <button className="timeframe-btn">4h</button>
            <button className="timeframe-btn">1d</button>
          </Box>
        </Box>
        <TradingViewChart data={marketData} height={500} />
      </Paper>

      {/* Bot Performance Cards - Sidebar */}
      <Paper className="agents-section" elevation={0}>
        <Box className="agents-header">
          🤖 Bot Performance
          <Chip
            label={`${bots.length} Active`}
            size="small"
            sx={{
              ml: 'auto',
              background: 'rgba(33, 150, 243, 0.2)',
              color: '#2196F3',
              fontWeight: 700
            }}
          />
        </Box>
        <BotPerformanceCards bots={bots} compact={true} />
      </Paper>

      {/* Bot Comparison Charts - Bottom */}
      <Box className="trades-section">
        <BotPerformanceComparison bots={bots.map(b => ({
          ...b,
          avg_trade_size: 20,
          best_trade: b.pnl > 0 ? b.pnl * 0.3 : 0,
          worst_trade: b.pnl < 0 ? b.pnl * 0.3 : 0,
        }))} />
      </Box>
    </Box>
  );
};

// Helper function to get agent emoji
function getAgentEmoji(agentId: string): string {
  const emojiMap: Record<string, string> = {
    'trend-momentum-agent': '📈',
    'strategy-optimization-agent': '🧠',
    'financial-sentiment-agent': '💭',
    'market-prediction-agent': '🔮',
    'volume-microstructure-agent': '📊',
    'vpin-hft': '⚡',
  };
  return emojiMap[agentId] || '🤖';
}

export default EnhancedDashboard;
