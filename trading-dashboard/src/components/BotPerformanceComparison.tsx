import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Box, Typography, Card, Grid, Avatar, Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface BotPerformance {
  id: string;
  name: string;
  emoji: string;
  pnl: number;
  win_rate: number;
  total_trades: number;
  active_positions: number;
  avg_trade_size: number;
  best_trade: number;
  worst_trade: number;
  equity_curve?: Array<{ time: number, value: number }>;
}

interface BotPerformanceComparisonProps {
  bots: BotPerformance[];
}

const BOT_COLORS = [
  '#2196F3', // Blue
  '#4CAF50', // Green
  '#FF9800', // Orange
  '#9C27B0', // Purple
  '#F44336', // Red
  '#00BCD4', // Cyan
];

export const BotPerformanceComparison: React.FC<BotPerformanceComparisonProps> = ({ bots }) => {
  // Sort bots by P&L for leaderboard
  const sortedBots = [...bots].sort((a, b) => b.pnl - a.pnl);

  // Prepare data for charts
  const performanceData = bots.map(bot => ({
    name: bot.emoji + ' ' + bot.name.split(' ')[0], // Shortened name
    pnl: bot.pnl,
    winRate: bot.win_rate * 100,
    trades: bot.total_trades,
  }));

  return (
    <Box sx={{ p: 2 }}>
      {/* Leaderboard */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#fff' }}>
        🏆 Bot Performance Leaderboard
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {sortedBots.map((bot, index) => (
          <Grid item xs={12} sm={6} md={4} key={bot.id}>
            <Card
              sx={{
                p: 2,
                background: 'rgba(30, 34, 45, 0.95)',
                border: index === 0 ? '2px solid gold' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
                position: 'relative',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4)',
                }
              }}
            >
              {/* Rank Badge */}
              {index < 3 && (
                <Chip
                  label={`#${index + 1}`}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: index === 0 ? 'gold' : index === 1 ? 'silver' : '#CD7F32',
                    color: '#000',
                    fontWeight: 700,
                  }}
                />
              )}

              {/* Bot Info */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: BOT_COLORS[index % BOT_COLORS.length],
                    width: 48,
                    height: 48,
                    fontSize: '24px',
                    mr: 2
                  }}
                >
                  {bot.emoji}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#fff' }}>
                    {bot.name.split(' ')[0]}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                    {bot.total_trades} trades
                  </Typography>
                </Box>
              </Box>

              {/* P&L */}
              <Box sx={{ mb: 1 }}>
                <Typography variant="h4" sx={{
                  fontWeight: 700,
                  color: bot.pnl >= 0 ? '#26a69a' : '#ef5350',
                  fontFamily: 'SF Mono, monospace',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}>
                  {bot.pnl >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  ${bot.pnl.toFixed(2)}
                </Typography>
              </Box>

              {/* Metrics Grid */}
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#9ca3af' }}>Win Rate</Typography>
                  <Typography variant="body2" sx={{
                    fontWeight: 600,
                    color: bot.win_rate >= 0.5 ? '#26a69a' : '#ef5350',
                    fontFamily: 'SF Mono, monospace'
                  }}>
                    {(bot.win_rate * 100).toFixed(1)}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#9ca3af' }}>Positions</Typography>
                  <Typography variant="body2" sx={{
                    fontWeight: 600,
                    color: '#fff',
                    fontFamily: 'SF Mono, monospace'
                  }}>
                    {bot.active_positions}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#9ca3af' }}>Best Trade</Typography>
                  <Typography variant="body2" sx={{
                    fontWeight: 600,
                    color: '#26a69a',
                    fontFamily: 'SF Mono, monospace'
                  }}>
                    ${bot.best_trade?.toFixed(2) || '0.00'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#9ca3af' }}>Worst Trade</Typography>
                  <Typography variant="body2" sx={{
                    fontWeight: 600,
                    color: '#ef5350',
                    fontFamily: 'SF Mono, monospace'
                  }}>
                    ${bot.worst_trade?.toFixed(2) || '0.00'}
                  </Typography>
                </Grid>
              </Grid>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* P&L Comparison Chart */}
      <Card sx={{ p: 3, mb: 3, background: 'rgba(30, 34, 45, 0.95)', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#fff' }}>
          💰 P&L Comparison
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                background: 'rgba(30, 34, 45, 0.98)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'P&L']}
            />
            <Bar dataKey="pnl" radius={[8, 8, 0, 0]}>
              {performanceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#26a69a' : '#ef5350'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Win Rate Comparison */}
      <Card sx={{ p: 3, mb: 3, background: 'rgba(30, 34, 45, 0.95)', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#fff' }}>
          🎯 Win Rate Comparison
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={performanceData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis type="number" domain={[0, 100]} stroke="#9ca3af" />
            <YAxis dataKey="name" type="category" stroke="#9ca3af" width={120} />
            <Tooltip
              contentStyle={{
                background: 'rgba(30, 34, 45, 0.98)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Win Rate']}
            />
            <Bar dataKey="winRate" fill="#2196F3" radius={[0, 8, 8, 0]}>
              {performanceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={BOT_COLORS[index % BOT_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Equity Curves - All Bots */}
      <Card sx={{ p: 3, background: 'rgba(30, 34, 45, 0.95)', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#fff' }}>
          📈 Equity Curves - Bot vs Bot
        </Typography>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis
              dataKey="time"
              stroke="#9ca3af"
              tickFormatter={(time) => new Date(time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            />
            <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${value}`} />
            <Tooltip
              contentStyle={{
                background: 'rgba(30, 34, 45, 0.98)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#fff'
              }}
              labelFormatter={(time) => new Date(time * 1000).toLocaleString()}
              formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            {bots.map((bot, index) => (
              bot.equity_curve && (
                <Line
                  key={bot.id}
                  data={bot.equity_curve}
                  type="monotone"
                  dataKey="value"
                  stroke={BOT_COLORS[index % BOT_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  name={bot.emoji + ' ' + bot.name.split(' ')[0]}
                  activeDot={{ r: 6 }}
                />
              )
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </Box>
  );
};

export default BotPerformanceComparison;
