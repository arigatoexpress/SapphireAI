import React from 'react';
import { Box, Card, Typography, LinearProgress, Grid, Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShowChartIcon from '@mui/icons-material/ShowChart';

interface BotMetrics {
  id: string;
  name: string;
  emoji: string;
  pnl: number;
  win_rate: number;
  total_trades: number;
  active_positions: number;
  capital: number;
  roi: number; // Return on investment %
  sharpe_ratio?: number;
}

interface BotPerformanceCardsProps {
  bots: BotMetrics[];
  compact?: boolean;
}

const BOT_COLORS: Record<string, string> = {
  'trend-momentum-agent': '#2196F3',
  'strategy-optimization-agent': '#4CAF50',
  'financial-sentiment-agent': '#FF9800',
  'market-prediction-agent': '#9C27B0',
  'volume-microstructure-agent': '#F44336',
  'vpin-hft': '#00BCD4',
};

export const BotPerformanceCards: React.FC<BotPerformanceCardsProps> = ({
  bots,
  compact = false
}) => {
  return (
    <Grid container spacing={2}>
      {bots.map((bot) => {
        const botColor = BOT_COLORS[bot.id] || '#2962FF';
        const isProfit = bot.pnl >= 0;
        const roi = ((bot.pnl / bot.capital) * 100);

        return (
          <Grid item xs={12} sm={6} md={compact ? 12 : 4} key={bot.id}>
            <Card
              sx={{
                p: 2.5,
                background: `linear-gradient(135deg, rgba(30, 34, 45, 0.98) 0%, rgba(25, 29, 40, 0.98) 100%)`,
                border: `2px solid ${botColor}`,
                borderRadius: 3,
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-6px) scale(1.02)',
                  boxShadow: `0 12px 24px ${botColor}40`,
                  borderColor: botColor,
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: `linear-gradient(90deg, ${botColor} 0%, transparent 100%)`,
                }
              }}
            >
              {/* Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      fontSize: '32px',
                      lineHeight: 1,
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                    }}
                  >
                    {bot.emoji}
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                      {bot.name.split(' Agent')[0]}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                      {bot.total_trades} trades • {bot.active_positions} open
                    </Typography>
                  </Box>
                </Box>

                {/* Status Indicator */}
                <Chip
                  label={bot.active_positions > 0 ? 'ACTIVE' : 'IDLE'}
                  size="small"
                  icon={<ShowChartIcon sx={{ fontSize: 14 }} />}
                  sx={{
                    background: bot.active_positions > 0 ? 'rgba(38, 166, 154, 0.2)' : 'rgba(156, 163, 175, 0.2)',
                    color: bot.active_positions > 0 ? '#26a69a' : '#9ca3af',
                    fontWeight: 700,
                    fontSize: '11px',
                    border: `1px solid ${bot.active_positions > 0 ? '#26a69a' : '#9ca3af'}`,
                  }}
                />
              </Box>

              {/* P&L Display */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
                  {isProfit ? (
                    <TrendingUpIcon sx={{ color: '#26a69a', fontSize: 28 }} />
                  ) : (
                    <TrendingDownIcon sx={{ color: '#ef5350', fontSize: 28 }} />
                  )}
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      color: isProfit ? '#26a69a' : '#ef5350',
                      fontFamily: '"SF Mono", "Monaco", "Consolas", monospace',
                      lineHeight: 1,
                    }}
                  >
                    ${Math.abs(bot.pnl).toFixed(2)}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{
                  color: isProfit ? '#26a69a' : '#ef5350',
                  fontWeight: 600,
                  fontFamily: 'monospace'
                }}>
                  {roi >= 0 ? '+' : ''}{roi.toFixed(2)}% ROI
                </Typography>
              </Box>

              {/* Win Rate Progress */}
              <Box sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600 }}>
                    WIN RATE
                  </Typography>
                  <Typography variant="caption" sx={{
                    color: bot.win_rate >= 0.5 ? '#26a69a' : '#ef5350',
                    fontWeight: 700,
                    fontFamily: 'monospace'
                  }}>
                    {(bot.win_rate * 100).toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={bot.win_rate * 100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    background: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      background: bot.win_rate >= 0.5
                        ? 'linear-gradient(90deg, #26a69a 0%, #2ed9c3 100%)'
                        : 'linear-gradient(90deg, #ef5350 0%, #f48fb1 100%)',
                      borderRadius: 4,
                    }
                  }}
                />
              </Box>

              {/* Quick Stats Grid */}
              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <Box sx={{
                    p: 1.5,
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block', mb: 0.5 }}>
                      Capital
                    </Typography>
                    <Typography variant="h6" sx={{
                      fontWeight: 700,
                      color: '#fff',
                      fontFamily: 'monospace'
                    }}>
                      ${bot.capital}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{
                    p: 1.5,
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block', mb: 0.5 }}>
                      Sharpe
                    </Typography>
                    <Typography variant="h6" sx={{
                      fontWeight: 700,
                      color: (bot.sharpe_ratio || 0) > 1 ? '#26a69a' : '#9ca3af',
                      fontFamily: 'monospace'
                    }}>
                      {(bot.sharpe_ratio || 0).toFixed(2)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Performance Bar - Visual indicator */}
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ flex: 1, height: 4, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 2, overflow: 'hidden' }}>
                  <Box sx={{
                    width: `${Math.min(100, Math.max(0, roi + 50))}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${botColor} 0%, ${botColor}aa 100%)`,
                    transition: 'width 0.5s ease'
                  }} />
                </Box>
                <Typography variant="caption" sx={{ color: botColor, fontWeight: 700, minWidth: '60px', textAlign: 'right' }}>
                  {roi >= 0 ? `+${roi.toFixed(1)}%` : `${roi.toFixed(1)}%`}
                </Typography>
              </Box>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default BotPerformanceCards;
