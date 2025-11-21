import React from 'react';
import { Box, Card, Typography, Grid, Chip, Divider } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';

interface BotPerformance {
  id: string;
  name: string;
  emoji: string;

  // Portfolio values
  starting_capital: number;
  current_value: number;

  // Performance metrics
  pnl_total: number;
  pnl_today: number;
  pnl_week: number;

  // Performance percentages
  roi_total: number;
  roi_today: number;
  roi_week: number;

  // Trading stats
  win_rate: number;
  total_trades: number;
  wins: number;
  losses: number;
  active_positions: number;
}

interface SimplifiedBotDashboardProps {
  bots: BotPerformance[];
}

const BOT_COLORS: Record<string, string> = {
  'trend-momentum-agent': '#2196F3',
  'strategy-optimization-agent': '#4CAF50',
  'financial-sentiment-agent': '#FF9800',
  'market-prediction-agent': '#9C27B0',
  'volume-microstructure-agent': '#F44336',
  'vpin-hft': '#00BCD4',
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatPercent = (value: number) => {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

const PerformanceIndicator: React.FC<{ value: number }> = ({ value }) => {
  if (value > 0.5) return <TrendingUpIcon sx={{ color: '#26a69a', fontSize: 20 }} />;
  if (value < -0.5) return <TrendingDownIcon sx={{ color: '#ef5350', fontSize: 20 }} />;
  return <RemoveIcon sx={{ color: '#9ca3af', fontSize: 20 }} />;
};

export const SimplifiedBotDashboard: React.FC<SimplifiedBotDashboardProps> = ({ bots }) => {
  // Sort bots by total ROI for display order
  const sortedBots = [...bots].sort((a, b) => b.roi_total - a.roi_total);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: '#fff' }}>
        🤖 AI Trading Bots - Performance Comparison
      </Typography>

      <Typography variant="body1" sx={{ mb: 4, color: '#9ca3af', maxWidth: 800 }}>
        Each bot started with <strong style={{ color: '#26a69a' }}>$100.00</strong> capital and trades independently using different AI models and strategies.
        Compare their performance across different timeframes to see which strategies work best.
      </Typography>

      <Grid container spacing={3}>
        {sortedBots.map((bot, index) => {
          const botColor = BOT_COLORS[bot.id] || '#2962FF';
          const isWinning = bot.roi_total > 0;
          const isActive = bot.active_positions > 0;

          return (
            <Grid item xs={12} md={6} lg={4} key={bot.id}>
              <Card
                sx={{
                  p: 3,
                  background: 'linear-gradient(135deg, rgba(30, 34, 45, 0.98) 0%, rgba(25, 29, 40, 0.95) 100%)',
                  border: `2px solid ${botColor}`,
                  borderRadius: 3,
                  position: 'relative',
                  height: '100%',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 12px 24px ${botColor}50`,
                  },
                }}
              >
                {/* Rank Badge */}
                {index < 3 && (
                  <Chip
                    label={`#${index + 1}`}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      background: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32',
                      color: '#000',
                      fontWeight: 900,
                      fontSize: '13px',
                      height: 28,
                    }}
                  />
                )}

                {/* Bot Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box
                    sx={{
                      fontSize: '48px',
                      lineHeight: 1,
                      mr: 2,
                      filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))'
                    }}
                  >
                    {bot.emoji}
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff', lineHeight: 1.2, mb: 0.5 }}>
                      {bot.name.replace(' Agent', '')}
                    </Typography>
                    <Chip
                      label={isActive ? '● TRADING' : '○ IDLE'}
                      size="small"
                      sx={{
                        background: isActive ? 'rgba(38, 166, 154, 0.2)' : 'rgba(156, 163, 175, 0.2)',
                        color: isActive ? '#26a69a' : '#9ca3af',
                        fontWeight: 700,
                        fontSize: '10px',
                        height: 20,
                      }}
                    />
                  </Box>
                </Box>

                {/* Portfolio Value Section */}
                <Box sx={{ mb: 3, p: 2, background: 'rgba(0, 0, 0, 0.3)', borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Portfolio Value
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: 1 }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        color: '#fff',
                        fontFamily: '"SF Mono", "Monaco", monospace',
                      }}
                    >
                      {formatCurrency(bot.current_value)}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: isWinning ? '#26a69a' : '#ef5350',
                        fontFamily: 'monospace',
                      }}
                    >
                      {formatPercent(bot.roi_total)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#6b7280', mt: 0.5, display: 'block' }}>
                    Started with {formatCurrency(bot.starting_capital)}
                  </Typography>
                </Box>

                <Divider sx={{ mb: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

                {/* Performance Over Time */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" sx={{ color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, mb: 1.5, display: 'block' }}>
                    Performance by Timeframe
                  </Typography>

                  {/* Today */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PerformanceIndicator value={bot.pnl_today} />
                      <Typography variant="body2" sx={{ color: '#d1d4dc', fontWeight: 500 }}>
                        Today
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 700,
                          color: bot.pnl_today >= 0 ? '#26a69a' : '#ef5350',
                          fontFamily: 'monospace',
                        }}
                      >
                        {formatCurrency(bot.pnl_today)}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: bot.pnl_today >= 0 ? '#26a69a' : '#ef5350',
                          fontFamily: 'monospace',
                        }}
                      >
                        {formatPercent(bot.roi_today)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* This Week */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PerformanceIndicator value={bot.pnl_week} />
                      <Typography variant="body2" sx={{ color: '#d1d4dc', fontWeight: 500 }}>
                        This Week
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 700,
                          color: bot.pnl_week >= 0 ? '#26a69a' : '#ef5350',
                          fontFamily: 'monospace',
                        }}
                      >
                        {formatCurrency(bot.pnl_week)}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: bot.pnl_week >= 0 ? '#26a69a' : '#ef5350',
                          fontFamily: 'monospace',
                        }}
                      >
                        {formatPercent(bot.roi_week)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* All Time */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, background: 'rgba(41, 98, 255, 0.1)', borderRadius: 1.5, border: '1px solid rgba(41, 98, 255, 0.3)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PerformanceIndicator value={bot.pnl_total} />
                      <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700 }}>
                        All Time
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: isWinning ? '#26a69a' : '#ef5350',
                          fontFamily: 'monospace',
                        }}
                      >
                        {formatCurrency(bot.pnl_total)}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: isWinning ? '#26a69a' : '#ef5350',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '12px',
                        }}
                      >
                        {formatPercent(bot.roi_total)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Divider sx={{ mb: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

                {/* Trading Statistics */}
                <Box>
                  <Typography variant="caption" sx={{ color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, mb: 1.5, display: 'block' }}>
                    Trading Statistics
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>
                          Win Rate
                        </Typography>
                        <Typography variant="h6" sx={{
                          fontWeight: 700,
                          color: bot.win_rate >= 50 ? '#26a69a' : '#ef5350',
                          fontFamily: 'monospace',
                        }}>
                          {bot.win_rate.toFixed(1)}%
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>
                          Total Trades
                        </Typography>
                        <Typography variant="h6" sx={{
                          fontWeight: 700,
                          color: '#d1d4dc',
                          fontFamily: 'monospace',
                        }}>
                          {bot.total_trades}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>
                          Wins
                        </Typography>
                        <Typography variant="body1" sx={{
                          fontWeight: 600,
                          color: '#26a69a',
                          fontFamily: 'monospace',
                        }}>
                          {bot.wins}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>
                          Losses
                        </Typography>
                        <Typography variant="body1" sx={{
                          fontWeight: 600,
                          color: '#ef5350',
                          fontFamily: 'monospace',
                        }}>
                          {bot.losses}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                {/* Active Positions */}
                {bot.active_positions > 0 && (
                  <Box sx={{ mt: 2, p: 1.5, background: 'rgba(38, 166, 154, 0.1)', borderRadius: 1.5, border: '1px solid rgba(38, 166, 154, 0.3)' }}>
                    <Typography variant="caption" sx={{ color: '#26a69a', fontWeight: 700 }}>
                      🎯 {bot.active_positions} Active Position{bot.active_positions !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                )}
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Summary Stats */}
      <Card sx={{
        mt: 4,
        p: 3,
        background: 'linear-gradient(135deg, rgba(41, 98, 255, 0.15) 0%, rgba(30, 34, 45, 0.98) 50%)',
        border: '2px solid rgba(41, 98, 255, 0.3)',
        borderRadius: 3,
      }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff', mb: 3 }}>
          📊 Overall Performance Summary
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="caption" sx={{ color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>
                Total Portfolio Value
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff', fontFamily: 'monospace', mt: 1 }}>
                {formatCurrency(bots.reduce((sum, bot) => sum + bot.current_value, 0))}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
                Started with {formatCurrency(bots.reduce((sum, bot) => sum + bot.starting_capital, 0))}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="caption" sx={{ color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>
                Total P&L
              </Typography>
              <Typography variant="h4" sx={{
                fontWeight: 700,
                color: bots.reduce((sum, bot) => sum + bot.pnl_total, 0) >= 0 ? '#26a69a' : '#ef5350',
                fontFamily: 'monospace',
                mt: 1
              }}>
                {formatCurrency(bots.reduce((sum, bot) => sum + bot.pnl_total, 0))}
              </Typography>
              <Typography variant="body2" sx={{
                color: bots.reduce((sum, bot) => sum + bot.pnl_total, 0) >= 0 ? '#26a69a' : '#ef5350',
                mt: 0.5,
                fontWeight: 600
              }}>
                {formatPercent((bots.reduce((sum, bot) => sum + bot.pnl_total, 0) / bots.reduce((sum, bot) => sum + bot.starting_capital, 0)) * 100)}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="caption" sx={{ color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>
                Best Performer
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: botColor, mt: 1 }}>
                {sortedBots[0]?.emoji} {sortedBots[0]?.name.split(' ')[0]}
              </Typography>
              <Typography variant="body2" sx={{ color: '#26a69a', mt: 0.5, fontWeight: 600, fontFamily: 'monospace' }}>
                {formatPercent(sortedBots[0]?.roi_total || 0)}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="caption" sx={{ color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>
                Active Positions
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#2196F3', fontFamily: 'monospace', mt: 1 }}>
                {bots.reduce((sum, bot) => sum + bot.active_positions, 0)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
                Across {bots.filter(b => b.active_positions > 0).length} bot{bots.filter(b => b.active_positions > 0).length !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
};

export default SimplifiedBotDashboard;
