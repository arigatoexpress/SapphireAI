import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Psychology,
  Analytics,
  Warning,
} from '@mui/icons-material';
import { useTrading } from '../contexts/TradingContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard: React.FC = () => {
  const { portfolio, agentActivities, recentSignals, loading, error, refreshData } = useTrading();

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
        <Button onClick={refreshData} sx={{ ml: 2 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  // Prepare data for charts
  const agentActivityData = agentActivities.map(activity => ({
    name: activity.agent_id.split('-')[0], // Short name
    activity: activity.activity_score,
    communications: activity.communication_count,
    trades: activity.trading_count,
  }));

  const portfolioAllocationData = portfolio ? Object.entries(portfolio.agent_allocations).map(([agent, allocation]) => ({
    name: agent.split('-')[0],
    value: allocation,
  })) : [];

  const COLORS = ['#00d4aa', '#ff6b35', '#4ecdc4', '#ffe66d', '#ffaaa5', '#a8e6cf'];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Trading Dashboard
      </Typography>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Portfolio Value
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#00d4aa', fontWeight: 700 }}>
                    ${portfolio?.portfolio_value.toLocaleString() || '0'}
                  </Typography>
                </Box>
                <AccountBalance sx={{ fontSize: 40, color: '#00d4aa' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Agents
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#ff6b35', fontWeight: 700 }}>
                    {agentActivities.length}
                  </Typography>
                </Box>
                <Psychology sx={{ fontSize: 40, color: '#ff6b35' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Recent Signals
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#4ecdc4', fontWeight: 700 }}>
                    {recentSignals.length}
                  </Typography>
                </Box>
                <Analytics sx={{ fontSize: 40, color: '#4ecdc4' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Risk Limit
                  </Typography>
                  <Typography variant="h4" sx={{ color: portfolio?.portfolio_value && portfolio.portfolio_value > 0 ? '#00d4aa' : '#ff6b35', fontWeight: 700 }}>
                    {portfolio ? `${(portfolio.risk_limit * 100).toFixed(1)}%` : '0%'}
                  </Typography>
                </Box>
                <Warning sx={{ fontSize: 40, color: portfolio?.portfolio_value && portfolio.portfolio_value > 0 ? '#00d4aa' : '#ff6b35' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* Agent Activity Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Agent Activity Levels
              </Typography>
              <Box sx={{ height: 300, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={agentActivityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: 8,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="activity"
                      stroke="#00d4aa"
                      strokeWidth={2}
                      dot={{ fill: '#00d4aa', strokeWidth: 2, r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="trades"
                      stroke="#ff6b35"
                      strokeWidth={2}
                      dot={{ fill: '#ff6b35', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Portfolio Allocation */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Portfolio Allocation
              </Typography>
              <Box sx={{ height: 300, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={portfolioAllocationData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {portfolioAllocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Signals */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Recent Trading Signals
              </Typography>
              <Box sx={{ mt: 2 }}>
                {recentSignals.slice(0, 5).map((signal, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2,
                      mb: 1,
                      borderRadius: 2,
                      backgroundColor: 'rgba(255,255,255,0.05)',
                    }}
                  >
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {signal.symbol}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {signal.source}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip
                        label={signal.side.toUpperCase()}
                        color={signal.side === 'buy' ? 'success' : 'error'}
                        size="small"
                      />
                      <Typography variant="body2">
                        ${signal.notional.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {new Date(signal.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </Box>
                ))}
                {recentSignals.length === 0 && (
                  <Typography color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                    No recent signals
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
